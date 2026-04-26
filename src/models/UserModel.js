import { DataTypes } from 'sequelize'
import sequelize from '../config/configdb.js'

const User = sequelize.define(
    'User',
    {
        email: {
            type: DataTypes.STRING(254),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
                len: [6, 254],
            },
        },
        password: {
            type: DataTypes.STRING(254), // Suficiente para hash de bcrypt
            allowNull: false,
            validate: {
                len: [8, 254], // Validamos la longitud, pero el hash puede exceder 60
                // Nota: La contraseña original se valida en el esquema Zod antes de hashear
            },
        },
        resetPasswordToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        resetPasswordExpires: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        username: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: '',
            validate: {
                len: [3, 20],
            },
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        tableName: 'users', // Nombre de la tabla en plural
        timestamps: true, // Agrega createdAt y updatedAt automáticamente
        underscored: true, // Usa snake_case en columnas (created_at, updated_at)
    }
)

export default User
