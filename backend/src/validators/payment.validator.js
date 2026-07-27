import { z } from 'zod'

const paymentBodySchema = z.object({
  orderId: z.string().trim().min(1),
  amount: z.union([
    z.number().int().positive(),
    z.string().trim().regex(/^\d+$/).transform((value) => Number(value))
  ])
})

export const createPaymentOrderSchema = z.object({
  body: paymentBodySchema.transform((body) => ({
    ...body,
    amount: Number(body.amount)
  }))
})

export const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().trim().min(1),
    razorpayOrderId: z.string().trim().min(1),
    razorpayPaymentId: z.string().trim().min(1),
    razorpaySignature: z.string().trim().min(1)
  })
})
