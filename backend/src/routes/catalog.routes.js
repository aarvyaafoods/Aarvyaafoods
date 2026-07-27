import { catalogController } from '../controllers/catalog.controller.js'
import { validate } from '../middlewares/validation.middleware.js'
import { newsletterSchema, productListSchema, stockNotifySchema } from '../validators/catalog.validator.js'

export async function catalogRoutes(app) {
  app.get('/home', catalogController.home)
  app.get('/products', { preHandler: validate(productListSchema) }, catalogController.products)
  app.get('/products/:id', catalogController.product)
  app.get('/products/slug/:slug', catalogController.productBySlug)
  app.get('/categories', catalogController.categories)
  app.get('/filters', catalogController.filters)
  app.get('/promos', catalogController.promos)
  app.get('/theme', catalogController.theme)
  app.post('/stock-notifications', { preHandler: validate(stockNotifySchema) }, catalogController.stockNotify)
  app.post('/newsletter-subscriptions', { preHandler: validate(newsletterSchema) }, catalogController.newsletter)
}
