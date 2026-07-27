import { ok } from '../utils/response.js'
import { catalogService } from '../services/catalog.service.js'

export const catalogController = {
  home: async (_request, reply) => ok(reply, 'Success', await catalogService.home()),
  filters: async (request, reply) => ok(reply, 'Success', await catalogService.filters(request.query || {})),
  categories: async (_request, reply) => ok(reply, 'Success', await catalogService.categories()),
  products: async (request, reply) => ok(reply, 'Success', await catalogService.products(request.validated.query)),
  product: async (request, reply) => ok(reply, 'Success', await catalogService.product(request.params.id)),
  productBySlug: async (request, reply) => ok(reply, 'Success', await catalogService.productBySlug(request.params.slug)),
  stockNotify: async (request, reply) => ok(reply, 'Notification saved', await catalogService.stockNotify(request.validated.body), 201),
  newsletter: async (request, reply) => ok(reply, 'Subscribed successfully', await catalogService.newsletter(request.validated.body), 201),
  promos: async (_request, reply) => ok(reply, 'Success', await catalogService.promos()),
  theme: async (_request, reply) => ok(reply, 'Success', await catalogService.theme()),
}
