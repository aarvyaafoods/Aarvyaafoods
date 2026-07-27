import { adminRepository } from '../repositories/admin.repository.js'
import { catalogRepository } from '../repositories/catalog.repository.js'
import { userRepository } from '../repositories/user.repository.js'

export const adminService = {
  dashboard: () => adminRepository.dashboard(),
  products: (filters) => catalogRepository.listProducts(filters),
  product: async (id) => {
    const product = await adminRepository.product(id)
    if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
    return product
  },
  createProduct: (data) => adminRepository.saveProduct(data),
  updateProduct: (id, data) => adminRepository.saveProduct(data, id),
  deleteProduct: async (id) => {
    const product = await adminRepository.deleteProduct(id)
    if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
    return product
  },
  categories: () => adminRepository.categories(),
  createCategory: (data) => adminRepository.saveCategory(data),
  updateCategory: (id, data) => adminRepository.saveCategory(data, id),
  categoryDeleteImpact: (id) => adminRepository.categoryDeleteImpact(id),
  deleteCategory: async (id) => {
    const category = await adminRepository.deleteCategory(id)
    if (!category) throw Object.assign(new Error('Category not found'), { statusCode: 404 })
    return category
  },
  colors: () => adminRepository.colors(),
  createColor: (data) => adminRepository.saveColor(data),
  updateColor: (id, data) => adminRepository.saveColor(data, id),
  deleteColor: (id) => adminRepository.deleteColor(id),
  sizes: () => adminRepository.sizes(),
  createSize: (data) => adminRepository.saveSize(data),
  updateSize: (id, data) => adminRepository.saveSize(data, id),
  deleteSize: (id) => adminRepository.deleteSize(id),
  heroBanners: () => adminRepository.heroBanners(),
  createHeroBanner: (data) => adminRepository.saveHeroBanner(data),
  updateHeroBanner: (id, data) => adminRepository.saveHeroBanner(data, id),
  deleteHeroBanner: (id) => adminRepository.deleteHeroBanner(id),
  users: (filters) => userRepository.listUsers(filters),
  updateUser: (id, data) => adminRepository.updateUser(id, data),
  orders: (filters) => adminRepository.orders(filters),
  order: async (id) => {
    const order = await adminRepository.getOrder(id)
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 })
    return order
  },
  exportOrdersCsv: (filters) => adminRepository.exportOrdersCsv(filters),
  bulkUpdateOrders: async (body) => {
    const ids = Array.isArray(body.ids) ? body.ids : []
    if (!ids.length) throw Object.assign(new Error('Select at least one order'), { statusCode: 400 })
    return adminRepository.bulkUpdateOrders(ids, body)
  },
  updateOrder: async (id, patch) => {
    const order = await adminRepository.updateOrder(id, patch)
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 })
    return order
  },
  settings: () => adminRepository.settings(),
  subscriptions: (filters) => adminRepository.subscriptions(filters),
  createSubscription: (data) => adminRepository.saveSubscription(data),
  updateSubscription: (id, data) => adminRepository.saveSubscription(data, id),
  deleteSubscription: (id) => adminRepository.deleteSubscription(id),
  coupons: (filters) => adminRepository.coupons(filters),
  createCoupon: (data) => adminRepository.saveCoupon(data),
  updateCoupon: (id, data) => adminRepository.saveCoupon(data, id),
  deleteCoupon: (id) => adminRepository.deleteCoupon(id),
  updateFooterMarquee: (message) => adminRepository.updateSetting('footer_marquee', { message }),
  updateAnnouncementBar: (messages) => adminRepository.updateSetting('announcement_bar', { messages }),
  updateBranding: (branding) => adminRepository.updateSetting('branding', branding || {}),
  updateTheme: (theme) => adminRepository.updateTheme(theme),
}
