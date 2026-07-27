import { orderRepository } from '../repositories/order.repository.js'

function computePromo(promo, subtotal) {
  if (!promo) return 0
  if (Number(subtotal) < Number(promo.min_cart || 0)) throw Object.assign(new Error(`Minimum order ${promo.min_cart} required`), { statusCode: 400 })
  if (promo.type === 'percentage') return Math.round(subtotal * (Number(promo.value) / 100))
  if (promo.type === 'fixed') return Math.min(Number(promo.value), subtotal)
  return 0
}

export const orderService = {
  async validatePromo(code, cartTotal) {
    const promo = await orderRepository.getPromo(code.toUpperCase())
    if (!promo) throw Object.assign(new Error('Invalid or expired promo code'), { statusCode: 404 })
    const discount = computePromo(promo, cartTotal)
    const shipping = promo.type === 'shipping' || cartTotal >= 999 ? 0 : 149
    return { code: promo.code, type: promo.type, value: Number(promo.value), desc: promo.description, discount, shipping, total: cartTotal - discount + shipping }
  },

  async create(userId, data) {
    const mergedItems = Object.values(data.items.reduce((acc, item) => {
      const normalized = {
        ...item,
        quantity: Number(item.quantity) || 1
      }
      const key = `${normalized.productId}|${normalized.variantId}`
      acc[key] = acc[key] ? { ...acc[key], quantity: acc[key].quantity + normalized.quantity } : normalized
      return acc
    }, {}))
    const items = await orderRepository.priceItems(mergedItems)
    const subtotal = items.reduce((sum, item) => sum + Number(item.sell_price) * item.quantity, 0)
    const promo = data.promoCode ? await orderRepository.getPromo(data.promoCode.toUpperCase()) : null
    if (data.promoCode && !promo) throw Object.assign(new Error('Invalid or expired promo code'), { statusCode: 400 })
    const discount = computePromo(promo, subtotal)
    const shipping = promo?.type === 'shipping' || subtotal >= 999 ? 0 : 149
    return orderRepository.createOrder(userId, data, { items, subtotal, discount, shipping, total: subtotal - discount + shipping })
  },

  list: (userId, filters) => orderRepository.listOrders(userId, filters),
  get: async (userId, id) => {
    const order = await orderRepository.getOrder(userId, id)
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 })
    return order
  },
  cancel: (userId, id) => orderRepository.cancelOrder(userId, id)
}
