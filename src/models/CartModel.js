import { DataTypes } from 'sequelize'
import sequelize from '../config/configdb.js'

const Cart = sequelize.define(
    'Cart',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true, // null si el usuario es invitado
            references: {
                model: 'users', // Nombre de la tabla de usuarios
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL', // Si se elimina el usuario, el carrito queda con userId null
        },
        // Nota: Los productos NO van como un array dentro del modelo Cart.
        // En bases de datos relacionales, esto se maneja con una tabla separada (CartItem)
    },
    {
        tableName: 'carts',
        timestamps: true,
        underscored: true, // Para usar snake_case en columnas (created_at, updated_at)
    }
)

export default Cart
