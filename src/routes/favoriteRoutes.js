import express from 'express'
import {
    addFavorite,
    removeFavorite,
    getUserFavorites,
    checkFavorite,
} from '../controllers/favoriteControllers.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.use(authMiddleware) // Todas requieren autenticación

router.get('/', getUserFavorites)
router.get('/check/:productId', checkFavorite)
router.post('/:productId', addFavorite)
router.delete('/:productId', removeFavorite)

export default router
