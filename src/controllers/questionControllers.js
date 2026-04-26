import Question from '../models/QuestionModel.js'
import Answer from '../models/AnswerModel.js'
import User from '../models/userModel.js'
import Notification from '../models/NotificationModel.js'
import Product from '../models/ProductsModel.js'
import { Op } from 'sequelize'

// Obtener preguntas de un producto (con respuestas y datos de usuario)
export const getQuestionsByProduct = async (req, res) => {
    try {
        const { productId } = req.params
        const questions = await Question.findAll({
            where: { productId },
            include: [
                { model: User, as: 'user', attributes: ['id', 'username'] },
                {
                    model: Answer,
                    as: 'answer',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'username'],
                        },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],
        })
        res.json({ success: true, questions })
    } catch (error) {
        console.error('Error al obtener preguntas:', error)
        res.status(500).json({
            success: false,
            message: 'Error al obtener preguntas',
        })
    }
}

// Crear una pregunta (usuario autenticado)
export const createQuestion = async (req, res) => {
    try {
        const { productId } = req.params
        const { question } = req.body
        const userId = req.user.id

        if (!question || question.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'La pregunta no puede estar vacía',
            })
        }

        // Obtener el producto
        const product = await Product.findByPk(productId, {
            attributes: ['id', 'name'],
        })

        const newQuestion = await Question.create({
            productId,
            userId,
            question: question.trim(),
        })

        //  NOTIFICAR A TODOS LOS ADMINS
        const admins = await User.findAll({ where: { isAdmin: true } })

        for (const admin of admins) {
            await Notification.create({
                userId: admin.id,
                type: 'question',
                title: 'Nueva pregunta de usuario',
                message: `El usuario ${req.user.username} preguntó sobre "${product?.name || 'el producto'}": "${question.substring(0, 80)}${question.length > 80 ? '...' : ''}"`,
                link: `/admin/dashboard`,
                metadata: {
                    questionId: newQuestion.id,
                    productId: productId,
                    userId: userId,
                },
            })
        }

        // Opcional: devolver la pregunta con datos del usuario
        const questionWithUser = await Question.findByPk(newQuestion.id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'username'] },
            ],
        })

        res.status(201).json({ success: true, question: questionWithUser })
    } catch (error) {
        console.error('Error al crear pregunta:', error)
        res.status(500).json({
            success: false,
            message: 'Error al crear pregunta',
        })
    }
}

// Crear una respuesta (solo admin)
export const createAnswer = async (req, res) => {
    try {
        const { questionId } = req.params
        const { answer } = req.body
        const userId = req.user.id
        const isAdmin = req.user.isAdmin

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para responder',
            })
        }

        if (!answer || answer.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'La respuesta no puede estar vacía',
            })
        }

        // Verificar que la pregunta existe
        const question = await Question.findByPk(questionId)
        if (!question) {
            return res
                .status(404)
                .json({ success: false, message: 'Pregunta no encontrada' })
        }

        // Obtener el producto para el mensaje de la notificación
        const product = await Product.findByPk(question.productId, {
            attributes: ['id', 'name'],
        })

        // Verificar si ya tiene respuesta
        const existingAnswer = await Answer.findOne({ where: { questionId } })
        if (existingAnswer) {
            return res.status(400).json({
                success: false,
                message: 'Esta pregunta ya tiene respuesta',
            })
        }

        const newAnswer = await Answer.create({
            questionId,
            userId,
            answer: answer.trim(),
        })

        const answerWithUser = await Answer.findByPk(newAnswer.id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'username'] },
            ],
        })

        // CREAR NOTIFICACIÓN PARA EL USUARIO QUE PREGUNTÓ
        await Notification.create({
            userId: question.userId,
            type: 'question',
            title: 'Tu pregunta fue respondida',
            message: `El admin respondió a tu pregunta sobre "${product?.name || 'el producto'}"`,
            link: `/detailProduct/${question.productId}`,
            metadata: {
                questionId: question.id,
                productId: question.productId,
                answerId: newAnswer.id,
            },
        })

        res.status(201).json({ success: true, answer: answerWithUser })
    } catch (error) {
        console.error('Error al crear respuesta:', error)
        res.status(500).json({
            success: false,
            message: 'Error al crear respuesta',
        })
    }
}

// Eliminar pregunta (admin)
export const deleteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params
        if (!req.user.isAdmin) {
            return res
                .status(403)
                .json({ success: false, message: 'No autorizado' })
        }
        const deleted = await Question.destroy({ where: { id: questionId } })
        if (!deleted) {
            return res
                .status(404)
                .json({ success: false, message: 'Pregunta no encontrada' })
        }
        res.json({ success: true, message: 'Pregunta eliminada' })
    } catch (error) {
        console.error('Error al eliminar pregunta:', error)
        res.status(500).json({
            success: false,
            message: 'Error al eliminar pregunta',
        })
    }
}

// Eliminar respuesta (admin)
export const deleteAnswer = async (req, res) => {
    try {
        const { answerId } = req.params
        if (!req.user.isAdmin) {
            return res
                .status(403)
                .json({ success: false, message: 'No autorizado' })
        }
        const deleted = await Answer.destroy({ where: { id: answerId } })
        if (!deleted) {
            return res
                .status(404)
                .json({ success: false, message: 'Respuesta no encontrada' })
        }
        res.json({ success: true, message: 'Respuesta eliminada' })
    } catch (error) {
        console.error('Error al eliminar respuesta:', error)
        res.status(500).json({
            success: false,
            message: 'Error al eliminar respuesta',
        })
    }
}

// Obtener nuevas respuestas para el usuario autenticado
export const getUserNewAnswers = async (req, res) => {
    try {
        const userId = req.user.id
        const { lastCheck } = req.query
        const lastCheckDate = lastCheck
            ? new Date(parseInt(lastCheck))
            : new Date(0)

        const questions = await Question.findAll({
            where: { userId },
            include: [
                {
                    model: Answer,
                    as: 'answer',
                    required: true, // Solo preguntas que tienen respuesta
                    where: {
                        createdAt: { [Op.gt]: lastCheckDate },
                    },
                    include: [
                        { model: User, as: 'user', attributes: ['username'] },
                    ],
                },
            ],
            attributes: ['id', 'question'],
            order: [[{ model: Answer, as: 'answer' }, 'createdAt', 'DESC']],
        })

        res.json({ success: true, newAnswers: questions })
    } catch (error) {
        console.error('Error al obtener nuevas respuestas:', error)
        res.status(500).json({
            success: false,
            message: 'Error al obtener nuevas respuestas',
        })
    }
}
