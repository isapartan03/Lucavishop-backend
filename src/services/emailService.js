import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// Configurar el transporte de correo
const transporter = nodemailer.createTransport({
    service: 'gmail', // o 'hotmail', 'outlook', etc.
    auth: {
        user: process.env.EMAIL_USER, // tu correo
        pass: process.env.EMAIL_PASS, // tu contraseña de aplicación
    },
})

// Función para enviar correo de recuperación
export const sendResetPasswordEmail = async (email, resetToken) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

    await transporter.sendMail({
        from: `"LucaviShop" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Recuperación de contraseña',
        html: `
            <h2>Recupera tu contraseña</h2>
            <p>Has solicitado restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente enlace:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitaste esto, ignora este correo.</p>
        `,
    })
}

// Función para enviar factura (usando el mismo transporter)
export const sendInvoiceEmail = async (to, pdfBuffer, orderNumber) => {
    // ✅ Usa el transporter ya creado, no llames a createTransporter()
    await transporter.sendMail({
        from: `"lucaviShop" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Factura de tu pedido #${orderNumber}`,
        html: `
            <h2>¡Gracias por tu compra!</h2>
            <p>Adjunto encontrarás la factura de tu pedido <strong>#${orderNumber}</strong>.</p>
            <p>Si tienes alguna duda, responde a este correo.</p>
            <br/>
            <p>Saludos,<br/>El equipo de la tienda</p>
        `,
        attachments: [
            {
                filename: `factura-${orderNumber}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
            },
        ],
    })
}
