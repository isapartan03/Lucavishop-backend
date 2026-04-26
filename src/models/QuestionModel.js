import { DataTypes } from 'sequelize'
import sequelize from '../config/configdb.js'

const Question = sequelize.define(
    'Question',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
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
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        question: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        tableName: 'questions',
        timestamps: true,
        underscored: true,
    }
)

export default Question
