import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'

const generateInvoicePDF = (order, logoBuffer = null) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' })
        const stream = new PassThrough()
        const buffers = []

        stream.on('data', (chunk) => buffers.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(buffers)))
        stream.on('error', reject)

        doc.pipe(stream)

        // ---- Encabezado con logo y datos de la orden ----
        let currentY = 50

        // Logo (izquierda)
        if (logoBuffer) {
            doc.image(logoBuffer, 50, currentY, { width: 80 })
        } else {
            doc.fontSize(16)
                .font('Helvetica-Bold')
                .text('Al Collection', 50, currentY)
        }

        // Datos de la orden (derecha) - Usamos coordenadas fijas
        doc.fontSize(10).font('Helvetica')
        doc.text(`Nº Orden: ${order.id}`, 360, currentY, { align: 'right' })
        doc.text(
            `Fecha: ${new Date(order.createdAt).toLocaleDateString()}`,
            360,
            currentY + 15,
            { align: 'right' }
        )
        doc.text(
            `Método de pago: ${order.paymentMethod === 'pago_movil' ? 'Pago Móvil' : 'Transferencia Bancaria'}`,
            360,
            currentY + 30,
            { align: 'right' }
        )

        // ⚠️ Reiniciamos la posición X al margen izquierdo para el resto del contenido
        doc.x = 50
        doc.moveDown(3) // Bajar 3 líneas desde la posición Y actual (que sigue siendo la misma Y después de los datos)

        // Título FACTURA centrado
        doc.fontSize(20)
            .font('Helvetica-Bold')
            .text('FACTURA', { align: 'center' })
        // Después de texto centrado, volvemos a poner X a 50 para evitar desviaciones
        doc.x = 50
        doc.moveDown(1)

        // ---- Información del cliente (aseguramos X=50) ----
        const customerName =
            `${order.shippingFirstName || ''} ${order.shippingLastName || ''}`.trim() ||
            order.user?.username ||
            'Cliente'
        const customerEmail = order.shippingEmail || order.user?.email
        const customerPhone = order.shippingPhone || ''
        const customerAddress =
            [
                order.shippingStreet,
                order.shippingNumber,
                order.shippingCity,
                order.shippingState,
                order.shippingZipCode,
            ]
                .filter(Boolean)
                .join(', ') || 'No especificada'

        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('Facturar a:', { underline: true })
        doc.fontSize(10).font('Helvetica')
        doc.text(customerName)
        doc.text(customerEmail)
        if (customerPhone) doc.text(customerPhone)
        doc.text(customerAddress)
        doc.moveDown(2)

        // ---- Tabla de productos (ya está bien, pero aseguramos X=50) ----
        const items = order.products || []
        let tableY = doc.y
        const tableColumns = {
            product: { x: 50, width: 200, label: 'Producto' },
            quantity: { x: 260, width: 60, label: 'Cantidad' },
            price: { x: 330, width: 80, label: 'Precio' },
            subtotal: { x: 430, width: 100, label: 'Subtotal' },
        }

        doc.fontSize(10).font('Helvetica-Bold')
        doc.text(tableColumns.product.label, tableColumns.product.x, tableY)
        doc.text(tableColumns.quantity.label, tableColumns.quantity.x, tableY)
        doc.text(tableColumns.price.label, tableColumns.price.x, tableY)
        doc.text(tableColumns.subtotal.label, tableColumns.subtotal.x, tableY)
        tableY += 15
        doc.font('Helvetica')

        let total = 0
        for (const item of items) {
            const product = item.product || {}
            let price = item.price ?? product.price ?? 0
            price = parseFloat(price)
            if (isNaN(price)) price = 0
            const quantity = Number(item.quantity) || 0
            const subtotal = quantity * price
            total += subtotal

            const name = product.name || 'Producto'
            const displayName =
                name.length > 45 ? name.substring(0, 42) + '...' : name

            doc.text(displayName, tableColumns.product.x, tableY, {
                width: tableColumns.product.width,
            })
            doc.text(quantity.toString(), tableColumns.quantity.x, tableY, {
                width: tableColumns.quantity.width,
                align: 'center',
            })
            doc.text(`$${price.toFixed(2)}`, tableColumns.price.x, tableY, {
                width: tableColumns.price.width,
                align: 'right',
            })
            doc.text(
                `$${subtotal.toFixed(2)}`,
                tableColumns.subtotal.x,
                tableY,
                { width: tableColumns.subtotal.width, align: 'right' }
            )
            tableY += 20

            if (tableY > 700) {
                doc.addPage()
                tableY = 50
                doc.font('Helvetica-Bold')
                doc.text(
                    tableColumns.product.label,
                    tableColumns.product.x,
                    tableY
                )
                doc.text(
                    tableColumns.quantity.label,
                    tableColumns.quantity.x,
                    tableY
                )
                doc.text(tableColumns.price.label, tableColumns.price.x, tableY)
                doc.text(
                    tableColumns.subtotal.label,
                    tableColumns.subtotal.x,
                    tableY
                )
                tableY += 15
                doc.font('Helvetica')
            }
        }

        doc.strokeColor('#cccccc')
            .lineWidth(1)
            .moveTo(50, tableY + 5)
            .lineTo(550, tableY + 5)
            .stroke()
        doc.font('Helvetica-Bold').fontSize(12)
        doc.text(`Total: $${total.toFixed(2)}`, 450, tableY + 15, {
            align: 'right',
        })
        doc.moveDown(3)

        // ---- Pie de página ----
        const pageHeight = doc.page.height - 80
        doc.fontSize(9).font('Helvetica')
        doc.text(
            'Gracias por tu compra. Esta factura es un comprobante válido.',
            50,
            pageHeight,
            { align: 'center' }
        )
        doc.text('Al Collection - +58 412-1234567', 50, pageHeight + 15, {
            align: 'center',
        })

        doc.end()
    })
}

export { generateInvoicePDF }
