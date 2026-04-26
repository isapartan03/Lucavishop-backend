import jwt from 'jsonwebtoken'

export const authMiddleware = (req, res, next) => {
    const token = req.cookies.accessToken
    if (!token) {
        return res.status(401).json({ message: 'No autenticado' })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        //console.log('Decoded token:', decoded)
        req.user = {
            id: decoded.userId,
            userId: decoded.userId,
            username: decoded.username,
            isAdmin: decoded.isAdmin,
        }
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' })
    }
}

export const isAdmin = (req, res, next) => {
    console.log('req.user en isAdmin:', req.user)
    if (!req.user?.isAdmin) {
        return res.status(403).json({
            message:
                'Acceso denegado: se requieren privilegios de administrador',
        })
    }
    next()
}
