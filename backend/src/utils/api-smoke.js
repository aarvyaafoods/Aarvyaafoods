process.env.JWT_ACCESS_SECRET ||= 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
process.env.JWT_REFRESH_SECRET ||= 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
process.env.FRONTEND_URL ||= 'https://staff-arc.vercel.app'

const { buildApp } = await import('../app.js')
const app = await buildApp()

const email = `smoke-${Date.now()}@example.com`
const password = 'Password123!'

async function call(method, url, body, token) {
  const res = await app.inject({
    method,
    url,
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    payload: body
  })
  const json = res.json()
  if (res.statusCode >= 400) {
    throw new Error(`${method} ${url} failed ${res.statusCode}: ${json.message}`)
  }
  return json.data
}

const home = await call('GET', '/api/catalog/home')
const products = await call('GET', '/api/catalog/products?limit=10')
const auth = await call('POST', '/api/auth/register', { name: 'Smoke User', email, password })
const me = await call('GET', '/api/auth/me', null, auth.accessToken)
const address = await call('POST', '/api/users/me/addresses', {
  label: 'Home',
  fullName: 'Smoke User',
  phone: '+91 99999 99999',
  addressLine1: 'Test Street',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600001',
  isDefault: true
}, auth.accessToken)
const promo = await call('POST', '/api/cart/promos/validate', { code: 'FIRST10', cartTotal: 1299 })
const order = await call('POST', '/api/orders', {
  addressId: address.id,
  paymentMethod: 'cod',
  items: [{
    productId: products.items[0].id,
    size: products.items[0].sizes[0].size,
    color: products.items[0].colors[0].hex,
    quantity: 1
  }]
}, auth.accessToken)

console.log(JSON.stringify({
  homeBanners: home.heroBanners.length,
  products: products.items.length,
  registered: Boolean(me.id),
  address: Boolean(address.id),
  promo: promo.code,
  order: order.order_number
}))

await app.close()
