import { z } from 'zod'

const indianPhone = z.string().regex(/^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/, 'Invalid Indian mobile number')
const indianPincode = z.string().regex(/^[1-9]\d{5}$/, 'Invalid Indian PIN code')

export const pagingSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    sortBy: z.string().default('created_at'),
    sortDir: z.enum(['asc', 'desc']).default('desc'),
    status: z.string().optional()
  })
})

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: indianPhone.optional()
  })
})

export const addressSchema = z.object({
  body: z.object({
    label: z.string().min(1).default('Home'),
    fullName: z.string().min(2),
    phone: indianPhone,
    addressLine1: z.string().min(8),
    addressLine2: z.string().optional().nullable(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: indianPincode,
    isDefault: z.boolean().default(false)
  })
})

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() })
})

export const notificationPrefsSchema = z.object({
  body: z.object({
    email: z.boolean(),
    promo: z.boolean(),
    whatsapp: z.boolean(),
    sms: z.boolean()
  })
})
