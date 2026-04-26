import express from 'express'
import upload from '../middleware/upload.js'
import { authMiddleware } from '../middleware/auth.js'
import RegisterUser, {
    Profile,
    LoginUser,
    Logout,
    updateAvatar,
} from '../controllers/AuthControllers.js'
import {
    forgotPassword,
    resetPassword,
} from '../controllers/AuthControllers.js'

const router = express.Router()

router.post('/register', RegisterUser)

router.post('/login', LoginUser)

router.post('/logout', Logout)

router.get('/profile', authMiddleware, Profile)

router.put('/avatar', authMiddleware, upload.single('avatar'), updateAvatar)
export default router

router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
