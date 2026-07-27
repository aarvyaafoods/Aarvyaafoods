import { orderController } from '../controllers/order.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validation.middleware.js'
import { orderCreateSchema, promoSchema } from '../validators/order.validator.js'

export async function orderRoutes(app) {
  app.post('/cart/promos/validate', { preHandler: validate(promoSchema) }, orderController.validatePromo)
  app.post('/orders', { preHandler: [requireAuth, validate(orderCreateSchema)] }, orderController.create)
  app.get('/orders', { preHandler: requireAuth }, orderController.list)
  app.get('/orders/:id', { preHandler: requireAuth }, orderController.get)
  app.post('/orders/:id/cancel', { preHandler: requireAuth }, orderController.cancel)
}
