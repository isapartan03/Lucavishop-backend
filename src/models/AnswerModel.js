import { DataTypes } from 'sequelize'
import sequelize from '../config/configdb.js'

const Answer = sequelize.define(
    'Answer',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        questionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'questions',
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
        answer: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        tableName: 'answers',
        timestamps: true,
        underscored: true,
    }
)

export default Answer
