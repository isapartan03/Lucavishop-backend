import express from 'express'
import dotenv from 'dotenv'
import sequelize, { testConnection, disconnectDB } from './config/configdb.js'
import authRoutes from './routes/authRoutes.js'
import producRoutes from './routes/productsRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import favoriteRoutes from './routes/favoriteRoutes.js'
import ratingRoutes from './routes/ratingRoutes.js'
import userRoutes from './routes/userRoutes.js'
import { sendResetPasswordEmail } from './services/emailService.js'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import './models/index.js'
import path from 'path'
import { fileURLToPath } from 'url'
import questionRoutes from './routes/questionRoutes.js'
dotenv.config()
const PORT = process.env.PORT || 3001
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Middlewares
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Cookie',
            'Set-Cookie',
        ],
        credentials: true,
    })
)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use(cookieParser())
app.use(express.json())

//const PORT = 3001

// Rutas API
app.use('/api/auth', authRoutes)
app.use('/api/products', producRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/ratings', ratingRoutes)
app.use('/api/users', userRoutes)

// Iniciar servidor y conectar DB
testConnection()
    .then(async () => {
        // Opcional: Sincronizar modelos (crea las tablas si no existen)
        await sequelize.sync({ alter: true }) // 'alter: true' actualiza tablas sin borrar datos
        console.log('📦 Modelos sincronizados con la base de datos')

        // Iniciar el servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
        })
    })
    .catch((error) => {
        console.error(
            '❌ No se pudo conectar a la base de datos:',
            error.message
        )
        // Desconectar en caso de error (opcional)
        disconnectDB()
    })
