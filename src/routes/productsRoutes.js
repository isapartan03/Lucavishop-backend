import express from 'express'
import {
    createProduct,
    deleteProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    getLowStockProducts,
} from '../controllers/productsControllers.js'
import { authMiddleware, isAdmin } from '../middleware/auth.js'

const router = express.Router()

//rutas públicas
router.get('/', getAllProducts)
router.get('/low-stock', authMiddleware, isAdmin, getLowStockProducts) //obtener stock bajo
router.get('/:id', getProductById) // Obtener producto por id

//rutas protegidas (solo los administradores pueden modificar productos)
router.post('/', createProduct) //crear producto
router.put('/:id', updateProduct) //actualizar un producto
router.delete('/:id', deleteProduct) //eliminar un producto

export default router
