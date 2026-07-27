import { catalogRepository } from '../repositories/catalog.repository.js'

export const catalogService = {
  home: () => catalogRepository.getHome(),
  filters: (filters = {}) => catalogRepository.getFilters(filters),
  categories: () => catalogRepository.listCategories(),
  products: async (filters) => {
    const result = await catalogRepository.listProducts(filters)
    return { ...result, page: filters.page, limit: filters.limit }
  },
  product: async (id) => {
    const product = await catalogRepository.getProduct(id)
    if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
    return product
  },
  productBySlug: async (slug) => {
    const product = await catalogRepository.getProductBySlug(slug)
    if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
    return product
  },
  stockNotify: (data) => catalogRepository.createStockNotification(data),
  newsletter: (data) => catalogRepository.createNewsletterSubscription(data),
  promos: () => catalogRepository.listActivePromos(),
  theme: () => catalogRepository.getTheme(),
}
