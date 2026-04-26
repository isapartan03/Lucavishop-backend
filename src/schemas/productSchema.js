import z from 'zod'

export const ProductSchema = z.object({
    name: z.string().min(3).max(58),
    description: z.string().min(10).max(500),
    price: z.number().min(0),
    stock: z.number().min(0).int(),
    imageUrl: z.url(),
})
