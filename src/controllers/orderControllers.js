import Order from '../models/OrderModel.js'
import OrderItem from '../models/OrderItem.js'
import Product from '../models/ProductsModel.js'
import sequelize from '../config/configdb.js' // Para transacciones
import Cart from '../models/CartModel.js'
import CartItem from '../models/CartItemModel.js'
import User from '../models/userModel.js'
import Notification from '../models/NotificationModel.js'
import { generateInvoicePDF } from '../services/invoicePDFService.js'
import { sendInvoiceEmail } from '../services/emailService.js'
import { Op } from 'sequelize'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CREAR ORDEN (con pago móvil o transferencia)
export const createOrder = async (req, res) => {
    const t = await sequelize.transaction() // Transacción para asegurar integridad

    try {
        const { items, shippingInfo, paymentMethod } = req.body
        const userId = req.user?.id
        // Validaciones básicas
        if (!items || !items.length) {
            await t.rollback()
            return res.status(400).json({
                success: false,
                message: 'Se requieren items para crear la orden',
            })
        }

        if (!shippingInfo) {
            await t.rollback()
            return res.status(400).json({
                success: false,
                message: 'Se requiere información de envío',
            })
        }

        // Validar stock y preparar datos de productos
        let totalAmount = 0
        const orderItems = []

        for (const item of items) {
            const product = await Product.findByPk(item.id, { transaction: t })
            if (!product) {
                await t.rollback()
                return res.status(404).json({
                    success: false,
                    message: `Producto con ID ${item.id} no encontrado`,
                })
            }
            if (product.stock < item.quantity) {
                await t.rollback()
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
                })
            }

            // Calcular total
            const subtotal = product.price * item.quantity
            totalAmount += subtotal

            // Preparar item para la orden
            orderItems.push({
                productId: product.id,
                quantity: item.quantity,
                price: product.price,
                name: product.name,
                imageUrl: product.imageUrl,
            })

            // Descontar stock (opcional, puedes hacerlo después del pago)
            product.stock -= item.quantity
            await product.save({ transaction: t })
        }

        // Crear la orden
        const order = await Order.create(
            {
                userId: userId || null,
                totalAmount,
                status: 'pending',
                paymentMethod, // ← NUEVO
                paymentStatus: 'pending', // ← NUEVO
                shippingFirstName: shippingInfo.firstName,
                shippingLastName: shippingInfo.lastName,
                shippingEmail: shippingInfo.email,
                shippingPhone: shippingInfo.phone,
                shippingStreet: shippingInfo.address.street,
                shippingNumber: shippingInfo.address.number,
                shippingCity: shippingInfo.address.city,
                shippingState: shippingInfo.address.state,
                shippingZipCode: shippingInfo.address.zipCode,
            },
            { transaction: t }
        )

        // Crear los items de la orden
        for (const item of orderItems) {
            await OrderItem.create(
                {
                    orderId: order.id,
                    ...item,
                },
                { transaction: t }
            )
        }
        // VACIAR CARRITO (solo si el usuario está autenticado)
        if (userId) {
            const cart = await Cart.findOne({
                where: { userId },
                transaction: t,
            })
            if (cart) {
                await CartItem.destroy({
                    where: { cartId: cart.id },
                    transaction: t,
                })
                // Opcional: eliminar el carrito
                // await cart.destroy({ transaction: t })
            }
        }

        // Confirmar transacción
        await t.commit()

        // (Opcional) Obtener la orden completa con items (fuera de la transacción)
        const completedOrder = await Order.findByPk(order.id, {
            include: [{ model: OrderItem, as: 'products' }],
        })

        res.status(201).json({
            success: true,
            message: 'Orden creada exitosamente',
            order: completedOrder,
            paymentInstructions: getPaymentInstructions(
                paymentMethod,
                order.id
            ),
        })
    } catch (error) {
        if (t && !t.finished) {
            await t.rollback()
        }
        console.error('Error al crear orden:', error)
        res.status(500).json({
            success: false,
            message: 'Error al crear la orden',
            error: error.message,
        })
    }
}

// INSTRUCCIONES DE PAGO
const getPaymentInstructions = (method, orderId) => {
    const instructions = {
        pago_movil: {
            method: 'Pago Móvil',
            bank: 'Banco de Venezuela',
            phone: '0412-1234567',
            id: 'V-12345678',
            reference: `Orden #${orderId}`,
            steps: [
                'Ingresa a la banca móvil de tu banco',
                'Selecciona "Pago Móvil"',
                'Ingresa los siguientes datos:',
                `  • Teléfono: 0412-1234567`,
                `  • Cédula/RIF: V-12345678`,
                `  • Banco: Banco de Venezuela`,
                `  • Referencia: ${orderId}`,
                'Confirma el pago y guarda el comprobante',
                'Luego haz clic en "Confirmar Pago" en nuestra web',
            ],
        },
        transferencia: {
            method: 'Transferencia Bancaria',
            bank: 'Banco Mercantil',
            account: '0102-1234-56-12345678',
            owner: 'Mi Tienda C.A.',
            rif: 'J-12345678-9',
            reference: `Orden #${orderId}`,
            steps: [
                'Ingresa a tu banca en línea',
                'Selecciona "Transferencia"',
                'Ingresa los siguientes datos:',
                `  • Banco: Banco Mercantil`,
                `  • Cuenta: 0102-1234-56-12345678`,
                `  • Titular: Mi Tienda C.A.`,
                `  • RIF: J-12345678-9`,
                `  • Monto: el total de la orden`,
                `  • Referencia: ${orderId}`,
                'Confirma la transferencia y guarda el comprobante',
                'Luego haz clic en "Confirmar Pago" en nuestra web',
            ],
        },
    }
    return instructions[method] || instructions.transferencia
}

// CONFIRMAR PAGO (usuario reporta)
export const confirmPayment = async (req, res) => {
    try {
        const { orderId } = req.params
        const { paymentReference } = req.body

        const order = await Order.findByPk(orderId)
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada',
            })
        }

        // Actualizar orden (pendiente de revisión por admin)
        await order.update({
            paymentReference,
            paymentStatus: 'pending_review',
            status: 'in_process',
        })

        res.json({
            success: true,
            message: 'Pago reportado exitosamente. Pendiente de confirmación.',
            order,
        })
    } catch (error) {
        console.error('Error al confirmar pago:', error)
        res.status(500).json({
            success: false,
            message: 'Error al confirmar el pago',
        })
    }
}

// OBTENER ÓRDENES DEL USUARIO
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user?.id

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado osea que no existe un usuario',
            })
        }

        const orders = await Order.findAll({
            where: { userId },
            include: [
                {
                    model: OrderItem,
                    as: 'products',
                    include: [{ model: Product, as: 'product' }],
                },
            ],
            order: [['createdAt', 'DESC']],
        })

        res.json({
            success: true,
            orders,
        })
    } catch (error) {
        console.error('Error al obtener órdenes:', error)
        res.status(500).json({
            success: false,
            message: 'Error al obtener las órdenes',
        })
    }
}

// OBTENER ORDEN POR ID
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params

        const order = await Order.findByPk(orderId, {
            include: [
                {
                    model: OrderItem,
                    as: 'products',
                    include: [{ model: Product, as: 'product' }],
                },
            ],
        })

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada',
            })
        }

        res.json({
            success: true,
            order,
        })
    } catch (error) {
        console.error('Error al obtener orden:', error)
        res.status(500).json({
            success: false,
            message: 'Error al obtener la orden',
        })
    }
}

//Cancelar orden
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params
        const userId = req.user.id

        const order = await Order.findOne({ where: { id: orderId, userId } })
        if (!order) {
            return res
                .status(404)
                .json({ success: false, message: 'Orden no encontrada' })
        }

        // Solo se puede cancelar si está pendiente o en proceso
        if (!['pending', 'in_process'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'No se puede cancelar esta orden',
            })
        }

        await order.update({ status: 'cancelled' })

        res.json({ success: true, message: 'Orden cancelada' })
    } catch (error) {
        console.error('Error al cancelar orden:', error)
        res.status(500).json({
            success: false,
            message: 'Error al cancelar la orden',
        })
    }
}
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                {
                    model: OrderItem,
                    as: 'products',
                    include: [{ model: Product, as: 'product' }],
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email'],
                },
            ],
            order: [['createdAt', 'DESC']],
        })
        res.json({ success: true, orders })
    } catch (error) {
        console.error('Error al obtener todas las órdenes:', error)
        res.status(500).json({
            success: false,
            message: 'Error al obtener las órdenes',
        })
    }
}

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params
        const { status, paymentStatus } = req.body

        const order = await Order.findByPk(orderId)
        if (!order) {
            return res
                .status(404)
                .json({ success: false, message: 'Orden no encontrada' })
        }

        if (status) order.status = status
        if (paymentStatus) order.paymentStatus = paymentStatus
        await order.save()

        res.json({ success: true, message: 'Estado actualizado', order })
    } catch (error) {
        console.error('Error al actualizar estado:', error)
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado',
        })
    }
}

//NUevo funciona hasta aqui sin lo de abajo
export const getPendingOrdersCount = async (req, res) => {
    try {
        const count = await Order.count({
            where: {
                [Op.or]: [
                    { status: 'pending' },
                    { paymentStatus: 'pending_review' },
                ],
            },
        })
        res.json({ success: true, count })
    } catch (error) {
        console.error('Error al contar órdenes pendientes:', error)
        res.status(500).json({
            success: false,
            message: 'Error al obtener el conteo',
        })
    }
}

export const getSalesStats = async (req, res) => {
    try {
        const dailySales = await Order.findAll({
            where: {
                status: 'approved',
                createdAt: {
                    [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
            raw: true,
        })

        const weeklySales = await Order.findAll({
            where: {
                status: 'approved',
                createdAt: {
                    [Op.gte]: new Date(
                        Date.now() - 12 * 7 * 24 * 60 * 60 * 1000
                    ),
                },
            },
            attributes: [
                [sequelize.fn('YEARWEEK', sequelize.col('created_at')), 'week'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
            ],
            group: [sequelize.fn('YEARWEEK', sequelize.col('created_at'))],
            order: [
                [sequelize.fn('YEARWEEK', sequelize.col('created_at')), 'ASC'],
            ],
            raw: true,
        })

        const monthlySales = await Order.findAll({
            where: {
                status: 'approved',
                createdAt: {
                    [Op.gte]: new Date(
                        Date.now() - 12 * 30 * 24 * 60 * 60 * 1000
                    ),
                },
            },
            attributes: [
                [
                    sequelize.fn(
                        'DATE_FORMAT',
                        sequelize.col('created_at'),
                        '%Y-%m'
                    ),
                    'month',
                ],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
            ],
            group: [
                sequelize.fn(
                    'DATE_FORMAT',
                    sequelize.col('created_at'),
                    '%Y-%m'
                ),
            ],
            order: [
                [
                    sequelize.fn(
                        'DATE_FORMAT',
                        sequelize.col('created_at'),
                        '%Y-%m'
                    ),
                    'ASC',
                ],
            ],
            raw: true,
        })

        res.json({ success: true, dailySales, weeklySales, monthlySales })
    } catch (error) {
        console.error('Error al obtener estadísticas de ventas:', error)
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
        })
    }
}

export const getTopProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10
        const topProducts = await OrderItem.findAll({
            attributes: [
                'productId',
                [
                    sequelize.fn('SUM', sequelize.col('OrderItem.quantity')),
                    'totalSold',
                ],
                [
                    sequelize.fn('SUM', sequelize.col('OrderItem.price')),
                    'totalRevenue',
                ],
            ],
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'price', 'imageUrl'],
                },
            ],
            group: ['productId', 'product.id'],
            order: [
                [
                    sequelize.fn('SUM', sequelize.col('OrderItem.quantity')),
                    'DESC',
                ],
            ],
            limit,
            raw: true,
            nest: true,
        })
        res.json({ success: true, topProducts })
    } catch (error) {
        console.error('Error al obtener productos más vendidos:', error)
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos más vendidos',
            error: error.message,
        })
    }
}

export const sendOrderInvoice = async (req, res) => {
    try {
        const { orderId } = req.params
        const userId = req.user.id

        const order = await Order.findByPk(orderId, {
            include: [
                {
                    model: OrderItem,
                    as: 'products',
                    include: [{ model: Product, as: 'product' }],
                },
                { model: User, as: 'user' },
            ],
        })

        if (!order) {
            return res
                .status(404)
                .json({ success: false, message: 'Orden no encontrada' })
        }

        const isAdmin = req.user.isAdmin === true
        if (!isAdmin && order.userId !== userId) {
            return res
                .status(403)
                .json({ success: false, message: 'No autorizado' })
        }

        // Corrección aquí: usar shippingEmail en lugar de shippingInfo?.email
        const email = order.shippingEmail || order.user?.email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'El usuario no tiene email registrado',
            })
        }
        console.log(
            'Order products sample:',
            JSON.stringify(order.products[0], null, 2)
        )

        let logoBuffer = null
        const logoPath = path.join(__dirname, '../../public/marca.png') // Ajusta la ruta
        if (fs.existsSync(logoPath)) {
            logoBuffer = fs.readFileSync(logoPath)
        }

        const pdfBuffer = await generateInvoicePDF(order, logoBuffer)
        await sendInvoiceEmail(email, pdfBuffer, order.id)

        res.json({ success: true, message: 'Factura enviada correctamente' })
    } catch (error) {
        console.error('Error en sendOrderInvoice:', error)
        res.status(500).json({ success: false, message: error.message })
    }
}
