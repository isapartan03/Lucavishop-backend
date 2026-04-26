import { DataTypes } from 'sequelize'
import sequelize from '../config/configdb.js'

const ProductSchema = sequelize.define(
    'Product',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'El nombre no puede estar vacío' },
            },
        },
        description: {
            type: DataTypes.TEXT, // TEXT permite descripciones largas
            allowNull: true, // No es obligatorio (trim se maneja automáticamente)
        },
        price: {
            type: DataTypes.DECIMAL(10, 2), // 10 dígitos totales, 2 decimales
            allowNull: false,
            validate: {
                min: {
                    args: [0],
                    msg: 'El precio no puede ser negativo',
                },
            },
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: {
                    args: [0],
                    msg: 'El stock no puede ser negativo',
                },
                isInt: { msg: 'El stock debe ser un número entero' },
            },
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isUrl: { msg: 'Debe ser una URL válida' },
                notEmpty: { msg: 'La URL de la imagen no puede estar vacía' },
            },
        },
    },
    {
        tableName: 'products', // Nombre de la tabla en plural
        timestamps: true, // Agrega createdAt y updatedAt automáticamente
        underscored: true, // Usa snake_case en columnas (created_at, updated_at)
    }
)

export default ProductSchema
