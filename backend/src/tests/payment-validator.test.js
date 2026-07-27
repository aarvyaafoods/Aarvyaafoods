import { describe, expect, it } from 'vitest'
import { createPaymentOrderSchema } from '../validators/payment.validator.js'

describe('payment validator', () => {
  it('accepts numeric string amounts and non-uuid order ids', async () => {
    const result = await createPaymentOrderSchema.parseAsync({
      body: { orderId: 'ord_123', amount: '500' }
    })

    expect(result.body.orderId).toBe('ord_123')
    expect(result.body.amount).toBe(500)
  })
})
