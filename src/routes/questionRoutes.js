import express from 'express'
import {
    getQuestionsByProduct,
    createQuestion,
    createAnswer,
    deleteQuestion,
    deleteAnswer,
    getUserNewAnswers,
} from '../controllers/questionControllers.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Obtener preguntas de un producto (público)
router.get('/product/:productId/questions', getQuestionsByProduct)

// Crear pregunta (usuario autenticado)
router.post('/product/:productId/questions', authMiddleware, createQuestion)

// Crear respuesta (admin)
router.post('/questions/:questionId/answer', authMiddleware, createAnswer)

// Eliminar pregunta (admin)
router.delete('/questions/:questionId', authMiddleware, deleteQuestion)

// Eliminar respuesta (admin)
router.delete('/answers/:answerId', authMiddleware, deleteAnswer)

// Obtener nuevas respuestas del usuario autenticado
router.get('/user/new-answers', authMiddleware, getUserNewAnswers)

export default router
