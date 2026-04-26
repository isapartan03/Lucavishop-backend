import { Cart, CartItem, Product } from '../models/index.js'

// AGREGAR PRODUCTO AL CARRITO
export const addToCart = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId
        const { productId, quantity = 1 } = req.body

        // Validaciones básicas
        if (!userId) {
            return res.status(400).json({ message: 'El userId es requerido' })
        }
        if (!productId) {
            return res
                .status(400)
                .json({ message: 'El productId es requerido' })
        }
        if (quantity < 1) {
            return res
                .status(400)
                .json({ message: 'La cantidad debe ser al menos 1' })
        }

        // Verificar que el producto exista y tenga stock
        const product = await Product.findByPk(productId)
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' })
        }
        if (product.stock < quantity) {
            return res.status(400).json({
                message: `Solo hay ${product.stock} unidades disponibles`,
            })
        }

        // Buscar o crear carrito del usuario
        let [cart, created] = await Cart.findOrCreate({
            where: { userId },
        })

        // Buscar si el producto ya está en el carrito
        const [cartItem, itemCreated] = await CartItem.findOrCreate({
            where: {
                cartId: cart.id,
                productId,
            },
            defaults: { quantity },
        })

        // Si el producto ya existía, actualizar cantidad
        if (!itemCreated) {
            cartItem.quantity += quantity

            // Verificar stock nuevamente
            if (product.stock < cartItem.quantity) {
                return res.status(400).json({
                    message: `No hay suficiente stock. Solo quedan ${product.stock} unidades`,
                })
            }

            await cartItem.save()
        }

        // Obtener carrito actualizado con productos
        const updatedCart = await Cart.findByPk(cart.id, {
            include: [
                {
                    model: CartItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                        },
                    ],
                },
            ],
        })

        res.status(200).json({
            message: 'Producto agregado al carrito',
            cart: updatedCart,
        })
    } catch (error) {
        console.error('Error en addToCart:', error)
        res.status(500).json({ message: 'Error al agregar al carrito' })
    }
}

// OBTENER CARRITO
export const getCart = async (req, res) => {
    try {
        const { userId } = req.params

        const cart = await Cart.findOne({
            where: { userId },
            include: [
                {
                    model: CartItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                        },
                    ],
                },
            ],
        })

        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' })
        }

        res.status(200).json({
            message: 'Carrito obtenido con éxito',
            cart,
        })
    } catch (error) {
        console.error('Error en getCart:', error)
        res.status(500).json({
            message: 'Error al obtener el carrito',
            error: error.message,
        })
    }
}

// ACTUALIZAR CANTIDAD DE UN PRODUCTO
export const updateCart = async (req, res) => {
    try {
        const { userId } = req.params
        const { productId, quantity } = req.body

        // Buscar carrito
        const cart = await Cart.findOne({ where: { userId } })
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' })
        }

        // Buscar item en el carrito
        const cartItem = await CartItem.findOne({
            where: { cartId: cart.id, productId },
        })

        if (!cartItem) {
            return res.status(404).json({
                message: 'Producto no encontrado en el carrito',
            })
        }

        // Verificar stock
        const product = await Product.findByPk(productId)
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' })
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                message: `Solo hay ${product.stock} unidades disponibles`,
            })
        }

        // Actualizar cantidad
        cartItem.quantity = quantity
        await cartItem.save()

        // Obtener carrito actualizado
        const updatedCart = await Cart.findByPk(cart.id, {
            include: [
                {
                    model: CartItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                        },
                    ],
                },
            ],
        })

        res.status(200).json({
            message: 'Carrito actualizado con éxito',
            cart: updatedCart,
        })
    } catch (error) {
        console.error('Error en updateCart:', error)
        res.status(500).json({
            message: 'Error al actualizar el carrito',
            error: error.message,
        })
    }
}

// ELIMINAR PRODUCTO DEL CARRITO
export const removeProductFromCart = async (req, res) => {
    try {
        const { userId } = req.params
        const { productId } = req.body

        // Buscar carrito
        const cart = await Cart.findOne({ where: { userId } })
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' })
        }

        // Eliminar el item
        const deleted = await CartItem.destroy({
            where: { cartId: cart.id, productId },
        })

        if (deleted === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado en el carrito',
            })
        }

        // Obtener carrito actualizado
        const updatedCart = await Cart.findByPk(cart.id, {
            include: [
                {
                    model: CartItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                        },
                    ],
                },
            ],
        })

        res.status(200).json({
            message: 'Producto eliminado del carrito',
            cart: updatedCart,
        })
    } catch (error) {
        console.error('Error en removeProductFromCart:', error)
        res.status(500).json({
            message: 'Error al eliminar producto del carrito',
        })
    }
}

// VACIAR CARRITO COMPLETAMENTE
export const clearCart = async (req, res) => {
    try {
        const { userId } = req.params

        const cart = await Cart.findOne({ where: { userId } })
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' })
        }

        // Eliminar todos los items del carrito
        await CartItem.destroy({ where: { cartId: cart.id } })

        res.status(200).json({
            message: 'Carrito vaciado con éxito',
            cart: { id: cart.id, userId, items: [] },
        })
    } catch (error) {
        console.error('Error en clearCart:', error)
        res.status(500).json({
            message: 'Error al vaciar el carrito',
        })
    }
}

// OBTENER TOTAL DEL CARRITO
export const getCartTotal = async (req, res) => {
    try {
        const userId = req.user?.id || req.params.userId

        if (!userId) {
            return res.status(400).json({ message: 'El userId es requerido' })
        }

        const cart = await Cart.findOne({
            where: { userId },
            include: [
                {
                    model: CartItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                        },
                    ],
                },
            ],
        })

        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' })
        }

        // Calcular total
        const total = cart.items.reduce((acc, item) => {
            return acc + item.product.price * item.quantity
        }, 0)

        res.status(200).json({
            message: 'Total calculado con éxito',
            total,
        })
    } catch (error) {
        console.error('Error en getCartTotal:', error)
        res.status(500).json({
            message: 'Error al calcular el total',
        })
    }
}
