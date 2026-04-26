import { z } from 'zod'

export const RegisterSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.email().min(6).max(254),
    password: z.string().min(8).max(254),
})

export const LoginSchema = z.object({
    email: z.email().min(6).max(254),
    password: z.string().min(8).max(254),
})
