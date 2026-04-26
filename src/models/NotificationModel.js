import { DataTypes } from 'sequelize'
import sequelize from '../config/configdb.js'

const Notification = sequelize.define(
    'Notification',
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        type: {
            type: DataTypes.ENUM('order', 'question', 'system'),
            defaultValue: 'system',
        },
        title: { type: DataTypes.STRING, allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: false },
        read: { type: DataTypes.BOOLEAN, defaultValue: false },
        link: { type: DataTypes.STRING, allowNull: true }, // Para redirigir
        metadata: { type: DataTypes.JSON, allowNull: true }, // Datos extra
    },
    { tableName: 'notifications', timestamps: true }
)

export default Notification
