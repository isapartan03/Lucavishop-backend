import { DataTypes } from 'sequelize'
import sequelize from '../config/configdb.js'

const OrderItem = sequelize.define(
    'OrderItem',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'orders',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE', // si se elimina la orden, se eliminan sus items
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT', // o CASCADE según tu lógica
        },
        // Los siguientes campos son una "foto" del producto en el momento de la compra
        name: {
            type: DataTypes.STRING,
            allowNull: true, // opcional, puedes hacerlo requerido si quieres
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: 'order_items',
        timestamps: true,
        underscored: true,
    }
)

export default OrderItem
