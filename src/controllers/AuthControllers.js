import UserModel from '../models/userModel.js'
import { RegisterSchema, LoginSchema } from '../schemas/AuthSchema.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { ZodError } from 'zod'
import crypto from 'crypto'
import { sendResetPasswordEmail } from '../services/emailService.js'
import { Op } from 'sequelize'

const RegisterUser = async (req, res) => {
    try {
        //traer la contraseña secreta
        const JWT_SECRET = process.env.JWT_SECRET

        //extraer información de usuario
        const { username, email, password } = RegisterSchema.parse(req.body)

        const ExistingUser = await UserModel.findOne({ where: { email } })

        if (ExistingUser) {
            return res.status(400).json({ message: 'El usuario ya existe' })
        }

        //encriptar contraseña
        const HashedPassword = await bcrypt.hash(password, 10)

        //Comprobar usuario admin
        const IsFirstUser = (await UserModel.count()) === 0

        //Crear el usuario y guardarlo en la DB
        const NewUser = await UserModel.create({
            username,
            email,
            password: HashedPassword,
            isAdmin: IsFirstUser,
        })

        //Generar un token con JWT
        const Token = jwt.sign({ userId: NewUser.id }, JWT_SECRET, {
            expiresIn: '1h',
        })

        //enviar un token como una cookie
        res.cookie('accessToken', Token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'productions', //true
            sameSite: process.env.NODE_ENV === 'productions' ? 'none' : 'lax',
            maxAge: 60 * 60 * 1000,
        })
            .status(201)
            .json({ message: 'Usuario registrado con éxito' })

        /*console.log('Token: ', Token)
        console.log(NewUser)
        res.json({ NewUser: NewUser })*/
    } catch (error) {
        res.json(error)
    }
}

export const LoginUser = async (req, res) => {
    try {
        //obtener clave secreta del entorno
        const JWT_SECRET = process.env.JWT_SECRET

        //extraer el email y contraseña del cuerpo de la petición
        //además validarlos
        const { email, password } = LoginSchema.parse(req.body)

        //buscar el usuario por email
        const user = await UserModel.findOne({ where: { email } })

        if (!user) {
            return res.status(400).json({ message: 'Credenciales invalidas' })
        }

        //comparar contraseñas
        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Credenciales invalidas' })
        }

        //generar un token con JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username, isAdmin: user.isAdmin },
            JWT_SECRET,
            {
                expiresIn: '1h',
            }
        )

        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            avatar: user.avatar,
        }

        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 60 * 60 * 1000,
        })
            .status(200)
            .json(userData)
    } catch (error) {
        if (error instanceof ZodError) {
            return res
                .status(400)
                .json(
                    error.issues.map((issues) => ({ message: issues.message }))
                )
        }

        res.status(500).json({
            message: 'Error al iniciar sesión',
            error: error,
        })
    }
}

export const Profile = async (req, res) => {
    //extraer el accessToken enviado por el cliente
    const Token = req.cookies.accessToken

    try {
        //Verificar o descodificar el token
        const decode = jwt.verify(Token, process.env.JWT_SECRET)

        //Buscar el usuario en la base de datos
        const user = await UserModel.findByPk(decode.userId)

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }

        res.status(200).json({
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin,
            username: user.username,
            avatar: user.avatar,
        })
    } catch (error) {
        res.status(401).json({ message: 'Acceso no autorizado' })
    }
}

export const Logout = (req, res) => {
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'productions',
        sameSite: process.env.NODE_ENV === 'productions' ? 'none' : 'lax',
    })
        .status(200)
        .json({ message: 'Cierre de sesión exitoso' })
}

export const updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ message: 'No se subió ninguna imagen' })
        }

        const userId = req.user.id

        // Construir la URL accesible desde el frontend
        const avatarUrl = `/uploads/avatars/${req.file.filename}`
        console.log('La ruta con la imagen: ', avatarUrl)

        // Actualizar usuario en la base de datos
        const user = await UserModel.findByPk(userId)
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }

        // Opcional: eliminar avatar anterior (si no es el por defecto y existe en disco)
        // if (user.avatar && user.avatar !== '/uploads/avatars/default.png') {
        //     const oldPath = path.join(__dirname, '..', user.avatar);
        //     fs.unlink(oldPath, (err) => { if (err) console.error('Error al eliminar avatar anterior:', err); });
        // }

        user.avatar = avatarUrl
        await user.save()

        res.json({
            message: 'Avatar actualizado',
            avatar: user.avatar,
        })
    } catch (error) {
        console.error('Error al subir avatar:', error)
        res.status(500).json({ message: 'Error al subir la imagen' })
    }
}

// 1. Solicitar recuperación de contraseña
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body

        const user = await UserModel.findOne({ where: { email } })
        if (!user) {
            return res.status(404).json({ message: 'Correo no encontrado.' })
        }

        // Generar token único
        const resetToken = crypto.randomBytes(32).toString('hex')
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex')

        // Guardar token en la base de datos (expira en 1 hora)
        await user.update({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: Date.now() + 3600000,
        })

        // Enviar correo
        await sendResetPasswordEmail(email, resetToken)

        res.json({
            message: 'Se ha enviado un enlace de recuperación a tu correo.',
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error al procesar la solicitud' })
    }
}

// 2. Restablecer contraseña
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex')

        const user = await UserModel.findOne({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { [Op.gt]: Date.now() },
            },
        })

        if (!user) {
            return res
                .status(400)
                .json({ message: 'El enlace es inválido o ha expirado.' })
        }

        // Encriptar nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await user.update({
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        })

        res.json({ message: 'Contraseña restablecida exitosamente.' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error al restablecer la contraseña' })
    }
}

export default RegisterUser
