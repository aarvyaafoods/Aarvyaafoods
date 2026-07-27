import { paymentController } from '../controllers/payment.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validation.middleware.js'
import { createPaymentOrderSchema, verifyPaymentSchema } from '../validators/payment.validator.js'

export async function paymentRoutes(app) {
  // Public webhook endpoint (no auth required)
  app.post('/webhook', paymentController.webhook)
  
  // Protected payment endpoints
  app.post('/orders', { preHandler: [requireAuth, validate(createPaymentOrderSchema)] }, paymentController.createOrder)
  app.post('/verify', { preHandler: [requireAuth, validate(verifyPaymentSchema)] }, paymentController.verify)
  app.get('/history', { preHandler: requireAuth }, paymentController.history)
}
