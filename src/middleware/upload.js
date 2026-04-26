import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/avatars'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname)
        cb(null, `avatar-${uniqueSuffix}${ext}`)
    },
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    )
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
        cb(null, true)
    } else {
        cb(new Error('Solo se permiten imágenes'))
    }
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2mb
    fileFilter: fileFilter,
})

export default upload
//
