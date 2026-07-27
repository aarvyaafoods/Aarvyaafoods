import { z } from 'zod'

const indianPhone = z.string().regex(/^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/, 'Invalid Indian mobile number')
const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/\d/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character')

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: indianPhone,
    password: strongPassword
  })
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
})

export const googleSchema = z.object({
  body: z.object({
    token: z.string().min(1)
  })
})

export const emailAvailabilitySchema = z.object({
  query: z.object({ email: z.string().email() })
})

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(10).optional() }).optional().default({})
})

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email() })
})

export const resetPasswordSchema = z.object({
  body: z.object({ token: z.string().min(16), password: strongPassword })
})

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: strongPassword
  })
})
