import Favorite from '../models/FavoriteModel.js'
import Product from '../models/ProductsModel.js'

// Agregar a favoritos
export const addFavorite = async (req, res) => {
    try {
        const { productId } = req.params
        const userId = req.user.id

        const existing = await Favorite.findOne({
            where: { userId, productId },
        })
        if (existing) {
            return res
                .status(400)
                .json({ message: 'Producto ya está en favoritos' })
        }

        await Favorite.create({ userId, productId })
        res.json({ success: true, message: 'Agregado a favoritos' })
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar favorito' })
    }
}

// Quitar de favoritos
export const removeFavorite = async (req, res) => {
    try {
        const { productId } = req.params
        const userId = req.user.id

        await Favorite.destroy({ where: { userId, productId } })
        res.json({ success: true, message: 'Eliminado de favoritos' })
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar favorito' })
    }
}

// Obtener favoritos del usuario
export const getUserFavorites = async (req, res) => {
    try {
        const userId = req.user.id

        const favorites = await Favorite.findAll({
            where: { userId },
            include: [{ model: Product, as: 'product' }],
        })

        res.json({ success: true, favorites })
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener favoritos' })
    }
}

// Verificar si un producto está en favoritos
export const checkFavorite = async (req, res) => {
    try {
        const { productId } = req.params
        const userId = req.user.id

        const favorite = await Favorite.findOne({
            where: { userId, productId },
        })
        res.json({ success: true, isFavorite: !!favorite })
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar favorito' })
    }
}
