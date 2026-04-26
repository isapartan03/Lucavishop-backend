import { ProductSchema } from '../schemas/productSchema.js'
import ProductsModels from '../models/ProductsModel.js'
import Rating from '../models/RatingModel.js' // 👈 AÑADIR
import { ZodError } from 'zod'
import { Sequelize, Op } from 'sequelize' // 👈 AÑADIR Op si no está

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, imageUrl } =
            ProductSchema.parse(req.body)
        const product = await ProductsModels.create({
            name,
            description,
            price,
            stock,
            imageUrl,
        })
        return res
            .status(201)
            .json({ message: 'Producto creado exitosamente', product })
    } catch (error) {
        if (error instanceof ZodError) {
            return res
                .status(400)
                .json(error.issues.map((issue) => ({ message: issue.message })))
        }
        return res.status(500).json({ message: 'Error al crear el producto' })
    }
}

export const updateProduct = async (req, res) => {
    try {
        const validateData = ProductSchema.partial().parse(req.body)

        const product = await ProductsModels.findByPk(req.params.id)

        // 👇 CORRECCIÓN: la variable se llamaba updateProduct, debe ser product
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' })
        }

        await product.update(validateData)
        const updatedProduct = await ProductsModels.findByPk(req.params.id)

        return res.status(200).json(updatedProduct)
    } catch (error) {
        res.json({ message: 'Error al actualizar producto' })
    }
}

export const getProductById = async (req, res) => {
    try {
        const product = await ProductsModels.findByPk(req.params.id, {
            attributes: {
                include: [
                    // Rating promedio
                    [
                        Sequelize.literal(`(
                            SELECT COALESCE(AVG(rating), 0)
                            FROM ratings AS r
                            WHERE r.product_id = Product.id
                        )`),
                        'avgRating',
                    ],
                    // Total de calificaciones
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM ratings AS r
                            WHERE r.product_id = Product.id
                        )`),
                        'totalRatings',
                    ],
                ],
            },
        })

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' })
        }

        // Formatear los valores
        const plainProduct = product.toJSON()
        plainProduct.avgRating = parseFloat(
            plainProduct.avgRating || 0
        ).toFixed(1)
        plainProduct.totalRatings = parseInt(plainProduct.totalRatings || 0)

        return res.status(200).json(plainProduct)
    } catch (error) {
        console.error('Error al obtener producto:', error)
        return res
            .status(500)
            .json({ message: 'Error al solicitar el producto de la bd' })
    }
}

// rating promedio + preguntas pendientes
export const getAllProducts = async (req, res) => {
    try {
        const products = await ProductsModels.findAll({
            attributes: {
                include: [
                    // Preguntas pendientes (sin respuesta)
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM questions AS q
                            LEFT JOIN answers AS a ON a.question_id = q.id
                            WHERE q.product_id = Product.id AND a.id IS NULL
                        )`),
                        'pendingQuestionsCount',
                    ],
                    // Rating promedio
                    [
                        Sequelize.literal(`(
                            SELECT COALESCE(AVG(rating), 0)
                            FROM ratings AS r
                            WHERE r.product_id = Product.id
                        )`),
                        'avgRating',
                    ],
                    // Total de calificaciones
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM ratings AS r
                            WHERE r.product_id = Product.id
                        )`),
                        'totalRatings',
                    ],
                ],
            },
            order: [[Sequelize.literal('pendingQuestionsCount'), 'DESC']],
        })

        // Formatear los números para que sean legibles
        const formattedProducts = products.map((product) => {
            const plain = product.toJSON()
            return {
                ...plain,
                avgRating: parseFloat(plain.avgRating || 0).toFixed(1),
                totalRatings: parseInt(plain.totalRatings || 0),
                pendingQuestionsCount: parseInt(
                    plain.pendingQuestionsCount || 0
                ),
            }
        })

        return res.status(200).json(formattedProducts)
    } catch (error) {
        console.error('Error al obtener productos:', error)
        return res
            .status(500)
            .json({ message: 'Error al obtener los productos' })
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const product = await ProductsModels.findByPk(req.params.id)

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' })
        }

        await product.destroy()
        return res
            .status(200)
            .json({ message: 'Producto eliminado Correctamente', product })
    } catch (error) {
        return res
            .status(500)
            .json({ message: 'No se pudo conectar a la base de datos' })
    }
}

export const getLowStockProducts = async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 10
        const products = await ProductsModels.findAll({
            where: { stock: { [Op.lt]: threshold } },
            attributes: ['id', 'name', 'stock', 'price'],
            order: [['stock', 'ASC']],
        })
        res.json({ success: true, products })
    } catch (error) {
        console.error('Error al obtener productos con bajo stock:', error)
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
        })
    }
}
