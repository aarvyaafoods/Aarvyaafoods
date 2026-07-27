import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { razorpay } from '../config/razorpay.js'
import { paymentRepository } from '../repositories/payment.repository.js'

export const paymentService = {
  async createOrder(userId, { orderId, amount }) {
    if (!razorpay) throw Object.assign(new Error('Razorpay is not configured - missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET'), { statusCode: 503 })
    const normalizedOrderId = String(orderId || '').trim()
    const normalizedAmount = Number(amount)
    if (!normalizedOrderId) throw Object.assign(new Error('Invalid order id'), { statusCode: 400 })
    if (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0) throw Object.assign(new Error('Invalid amount'), { statusCode: 400 })
    try {
      const providerOrder = await razorpay.orders.create({ amount: normalizedAmount, currency: 'INR', receipt: normalizedOrderId.slice(0, 40) })
      const payment = await paymentRepository.createPayment({ orderId: normalizedOrderId, userId, providerOrderId: providerOrder.id, amount: normalizedAmount, currency: 'INR' })
      return { keyId: env.RAZORPAY_KEY_ID, razorpayOrder: providerOrder, payment }
    } catch (error) {
      throw Object.assign(new Error(`Payment order creation failed: ${error.message}`), { statusCode: 502 })
    }
  },

  async verify(data) {
    if (!data.razorpayOrderId || !data.razorpayPaymentId || !data.razorpaySignature) {
      throw Object.assign(new Error('Missing required payment data'), { statusCode: 400 })
    }
    const body = `${data.razorpayOrderId}|${data.razorpayPaymentId}`
    const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(body).digest('hex')
    if (expected !== data.razorpaySignature) throw Object.assign(new Error('Payment signature verification failed'), { statusCode: 400 })
    try {
      return await paymentRepository.markPaymentSuccess(data)
    } catch (error) {
      throw Object.assign(new Error(`Payment verification failed: ${error.message}`), { statusCode: 502 })
    }
  },

  history: (userId, filters) => paymentRepository.history(userId, filters),

  async webhook(rawBody, signature) {
    const expected = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET || '').update(rawBody).digest('hex')
    if (expected !== signature) throw Object.assign(new Error('Invalid webhook signature'), { statusCode: 400 })
    return { received: true }
  }
}
