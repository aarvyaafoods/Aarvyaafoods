import { ok } from '../utils/response.js'
import { paymentService } from '../services/payment.service.js'

export const paymentController = {
  createOrder: async (request, reply) => ok(reply, 'Payment order created', await paymentService.createOrder(request.user.sub, request.validated.body), 201),
  verify: async (request, reply) => ok(reply, 'Payment verified', await paymentService.verify(request.validated.body)),
  history: async (request, reply) => ok(reply, 'Success', await paymentService.history(request.user.sub, request.query)),
  webhook: async (request, reply) => ok(reply, 'Webhook received', await paymentService.webhook(request.rawBody, request.headers['x-razorpay-signature']))
}
