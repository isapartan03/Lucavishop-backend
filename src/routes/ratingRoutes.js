import express from 'express'
import {
    getProductRating,
    getUserRating,
    rateProduct,
    deleteRating,
} from '../controllers/ratingControllers.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Públicas
router.get('/product/:productId', getProductRating)

// Requieren autenticación
router.get('/product/:productId/my', authMiddleware, getUserRating)
router.post('/product/:productId', authMiddleware, rateProduct)
router.delete('/product/:productId', authMiddleware, deleteRating)

export default router
