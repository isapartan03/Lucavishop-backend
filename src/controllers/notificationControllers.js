import Notification from '../models/NotificationModel.js'

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id
        const notifications = await Notification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 50,
        })

        const unreadCount = await Notification.count({
            where: { userId, read: false },
        })

        res.json({ notifications, unreadCount })
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener notificaciones' })
    }
}

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params
        await Notification.update(
            { read: true },
            { where: { id, userId: req.user.id } }
        )
        res.json({ message: 'Notificación marcada como leída' })
    } catch (error) {
        res.status(500).json({ message: 'Error al marcar notificación' })
    }
}

export const markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { read: true },
            { where: { userId: req.user.id } }
        )
        res.json({ message: 'Todas las notificaciones marcadas como leídas' })
    } catch (error) {
        res.status(500).json({ message: 'Error al marcar notificaciones' })
    }
}
