import { DataTypes } from 'sequelize'
import sequelize from '../config/configdb.js'

const CartItem = sequelize.define(
    'CartItem',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        cartId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'carts',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE', // Si se elimina el carrito, se eliminan sus items
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1,
            },
        },
    },
    {
        tableName: 'cart_items',
        timestamps: true,
        underscored: true,
    }
)

export default CartItem
