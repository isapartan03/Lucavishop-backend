import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

// Crear instancia de Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME, // Nombre de la base de datos
    process.env.DB_USER, // Usuario
    process.env.DB_PASSWORD, // Contraseña
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false, // Cambia a true para ver consultas SQL en consola
        define: {
            timestamps: true, // Agrega createdAt y updatedAt automáticamente
            underscored: true, // Usa snake_case en nombres de columnas
        },
    }
)

// Función para probar la conexión
export const testConnection = async () => {
    try {
        await sequelize.authenticate()
        console.log('✅ Conexión a MySQL establecida correctamente.')
    } catch (error) {
        console.error('❌ Error al conectar con MySQL:', error.message)
    }
}

export const disconnectDB = async () => {
    try {
        await sequelize.close()
        console.log('🔌 Base de datos MySQL desconectada.')
    } catch (error) {
        console.error('❌ Error al desconectar de MySQL:', error.message)
    }
}

// Exportar la instancia para usarla en modelos
export default sequelize
