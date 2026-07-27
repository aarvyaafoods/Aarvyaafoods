import { z } from 'zod'

const indianPhone = z.string().regex(/^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/, 'Invalid Indian mobile number')
const indianPincode = z.string().regex(/^[1-9]\d{5}$/, 'Invalid Indian PIN code')

export const orderCreateSchema = z.object({
  body: z.object({
    addressId: z.string().uuid().optional(),
    address: z.object({
      label: z.string().default('Home'),
      fullName: z.string().min(2),
      phone: indianPhone,
      addressLine1: z.string().min(8),
      addressLine2: z.string().optional().nullable(),
      city: z.string().min(2),
      state: z.string().min(2),
      pincode: indianPincode
    }).optional(),
    items: z.array(z.object({
      productId: z.string().uuid(),
      productSlug: z.string().optional(),
      variantId: z.string().uuid(),
      quantity: z.number().int().min(1)
    })).min(1),
    promoCode: z.string().optional(),
    paymentMethod: z.enum(['razorpay', 'cod']).default('razorpay')
  }).refine(data => data.addressId || data.address, {
    message: 'Delivery address is required',
    path: ['addressId']
  })
})

export const promoSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    cartTotal: z.number().min(0)
  })
})
