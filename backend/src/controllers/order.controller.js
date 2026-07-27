import { ok } from '../utils/response.js'
import { orderService } from '../services/order.service.js'

export const orderController = {
  validatePromo: async (request, reply) => ok(reply, 'Promo applied', await orderService.validatePromo(request.validated.body.code, request.validated.body.cartTotal)),
  create: async (request, reply) => ok(reply, 'Order created', await orderService.create(request.user.sub, request.validated.body), 201),
  list: async (request, reply) => ok(reply, 'Success', await orderService.list(request.user.sub, request.query)),
  get: async (request, reply) => ok(reply, 'Success', await orderService.get(request.user.sub, request.params.id)),
  cancel: async (request, reply) => ok(reply, 'Order cancelled', await orderService.cancel(request.user.sub, request.params.id))
}
