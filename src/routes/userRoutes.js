import express from 'express'
import {
    getUserCount,
    getUsersRegisteredToday,
} from '../controllers/userControllers.js'
import { authMiddleware, isAdmin } from '../middleware/auth.js'

const router = express.Router()

router.get('/count', authMiddleware, isAdmin, getUserCount)
router.get('/today-count', authMiddleware, isAdmin, getUsersRegisteredToday)

export default router
