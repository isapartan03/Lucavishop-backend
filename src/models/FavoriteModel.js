import { DataTypes } from 'sequelize'
import sequelize from '../config/configdb.js'

const Favorite = sequelize.define(
    'Favorite',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        // NO definas userId ni productId aquí
        // NO definas índices aquí
    },
    {
        tableName: 'favorites',
        timestamps: true,
    }
)

export default Favorite
