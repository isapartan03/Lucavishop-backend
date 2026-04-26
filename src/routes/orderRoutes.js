import express from 'express'
import {
    createOrder,
    confirmPayment,
    getUserOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    getPendingOrdersCount,
    getSalesStats,
    getTopProducts,
    sendOrderInvoice,
} from '../controllers/orderControllers.js'
import { authMiddleware, isAdmin } from '../middleware/auth.js'

const router = express.Router()

// Crear nueva orden
router.post('/create', authMiddleware, createOrder)

// Confirmar pago (usuario reporta)
router.post('/:orderId/confirm-payment', authMiddleware, confirmPayment)

// Obtener órdenes del usuario autenticado
router.get('/user', authMiddleware, getUserOrders)

//Ruta para obtener todas la ordenes
router.get('/admin/all', authMiddleware, isAdmin, getAllOrders)

//Actualizar las ordenes
router.put('/admin/:orderId/status', authMiddleware, isAdmin, updateOrderStatus)
//devuelve la cantidad de ordenes pendientes
router.get(
    '/admin/pending-count',
    authMiddleware,
    isAdmin,
    getPendingOrdersCount
)
//Obtener estadisticas
router.get('/sales-stats', authMiddleware, isAdmin, getSalesStats)
//Productos mas vendidos
router.get('/top-products', authMiddleware, isAdmin, getTopProducts)

//Cancelar orden
router.put('/:orderId/cancel', authMiddleware, cancelOrder)
// Obtener orden por ID (público o con validación)
router.post('/:orderId/send-invoice', authMiddleware, sendOrderInvoice)
router.get('/:orderId', getOrderById)

export default router
