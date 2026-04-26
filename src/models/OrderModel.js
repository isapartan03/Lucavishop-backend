import { DataTypes } from 'sequelize'
import sequelize from '../config/configdb.js'

const Order = sequelize.define(
    'Order',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true, // porque no es obligatorio en el modelo original
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL', // si el usuario se elimina, el pedido queda sin usuario
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        status: {
            type: DataTypes.ENUM(
                'pending',
                'approved',
                'rejected',
                'cancelled',
                'in_process'
            ),
            defaultValue: 'pending',
            allowNull: false,
        },
        // Información de envío (campos planos)
        shippingFirstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        shippingLastName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        shippingEmail: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true,
            },
        },
        shippingPhone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        shippingStreet: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        shippingNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        shippingCity: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        shippingState: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        shippingZipCode: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.ENUM('pago_movil', 'transferencia'),
            allowNull: false,
            defaultValue: 'transferencia',
        },
        paymentReference: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        paymentStatus: {
            type: DataTypes.ENUM(
                'pending',
                'pending_review',
                'approved',
                'rejected'
            ),
            defaultValue: 'pending',
            allowNull: false,
        },
    },
    {
        tableName: 'orders',
        timestamps: true,
        underscored: true, // para usar snake_case en la base de datos (ej: shipping_first_name)
    }
)

export default Order
