import User from '../models/userModel.js'
import { Op } from 'sequelize'

export const getUserCount = async (req, res) => {
    try {
        const count = await User.count()
        res.json({ success: true, count })
    } catch (error) {
        console.error('Error al contar usuarios:', error)
        res.status(500).json({
            success: false,
            message: 'Error al contar usuarios',
        })
    }
}

export const getUsersRegisteredToday = async (req, res) => {
    try {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)

        const count = await User.count({
            where: {
                createdAt: {
                    [Op.between]: [startOfDay, endOfDay],
                },
            },
        })
        res.json({ success: true, count })
    } catch (error) {
        console.error('Error al contar usuarios registrados hoy:', error)
        res.status(500).json({
            success: false,
            message: 'Error al obtener conteo',
        })
    }
}
