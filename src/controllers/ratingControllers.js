import Rating from '../models/RatingModel.js'
import Product from '../models/ProductsModel.js'
import { Op } from 'sequelize'

// Obtener rating promedio de un producto
export const getProductRating = async (req, res) => {
    try {
        const { productId } = req.params

        const ratings = await Rating.findAll({
            where: { productId },
            attributes: ['rating'],
        })

        const total = ratings.length
        const average =
            total > 0
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / total
                : 0

        res.json({
            success: true,
            average: parseFloat(average.toFixed(1)),
            total,
            ratings,
        })
    } catch (error) {
        console.error('Error al obtener rating:', error)
        res.status(500).json({ message: 'Error al obtener rating' })
    }
}

// Obtener calificación del usuario actual para un producto
export const getUserRating = async (req, res) => {
    try {
        const { productId } = req.params
        const userId = req.user.id

        const rating = await Rating.findOne({ where: { userId, productId } })
        res.json({ success: true, rating: rating?.rating || null })
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener calificación' })
    }
}

// Crear o actualizar calificación
export const rateProduct = async (req, res) => {
    try {
        const { productId } = req.params
        const { rating, comment } = req.body
        const userId = req.user.id

        if (!rating || rating < 1 || rating > 5) {
            return res
                .status(400)
                .json({ message: 'La calificación debe ser entre 1 y 5' })
        }

        // Verificar que el producto existe
        const product = await Product.findByPk(productId)
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' })
        }

        // Crear o actualizar
        const [ratingRecord, created] = await Rating.upsert({
            userId,
            productId,
            rating,
            comment: comment || null,
        })

        res.json({
            success: true,
            message: created
                ? 'Calificación agregada'
                : 'Calificación actualizada',
            rating: ratingRecord,
        })
    } catch (error) {
        console.error('Error al calificar:', error)
        res.status(500).json({ message: 'Error al calificar' })
    }
}

// Eliminar calificación
export const deleteRating = async (req, res) => {
    try {
        const { productId } = req.params
        const userId = req.user.id

        await Rating.destroy({ where: { userId, productId } })
        res.json({ success: true, message: 'Calificación eliminada' })
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar calificación' })
    }
}
