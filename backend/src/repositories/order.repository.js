import { query, transaction } from '../config/db.js'

export const orderRepository = {
  async getPromo(code) {
    const { rows } = await query(
      `SELECT * FROM promo_codes WHERE code=$1 AND deleted_at IS NULL AND is_active=true AND status='active'
       AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now())`,
      [code]
    )
    return rows[0]
  },

  async createOrder(userId, data, totals) {
    return transaction(async (client) => {
      const number = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
      const paymentStatus = data.paymentMethod === 'cod' ? 'cod_pending' : 'pending'
      const orderStatus = data.paymentMethod === 'cod' ? 'confirmed' : 'pending'
      const shippingAddress = data.addressId
        ? await getAddressSnapshot(client, userId, data.addressId)
        : data.address
      const order = await client.query(
        `INSERT INTO orders(user_id, order_number, address_id, shipping_address, subtotal, discount_amount, shipping_amount, total, promo_code, payment_method, payment_status, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [userId, number, data.addressId || null, shippingAddress || null, totals.subtotal, totals.discount, totals.shipping, totals.total, data.promoCode || null, data.paymentMethod, paymentStatus, orderStatus]
      )
      for (const item of totals.items) {
        await client.query(
          `INSERT INTO order_items(order_id, product_id, product_name, brand_name, size, color, quantity, unit_price, total_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [order.rows[0].id, item.product_id, item.name, item.brand, `${item.quantity_value} ${item.unit}`, item.color_name, item.quantity, item.selling_price, item.selling_price * item.quantity]
        )
        if (data.paymentMethod === 'cod') {
          await client.query(`UPDATE product_variants SET stock=GREATEST(stock-$1,0), updated_at=now() WHERE id=$2`, [item.quantity, item.variant_id])
        }
      }
      return order.rows[0]
    })
  },

  async priceItems(items) {
    if (!items?.length) throw Object.assign(new Error('Your cart is empty'), { statusCode: 400 })
    const ids = [...new Set(items.map(item => item.productId))]
    const slugs = [...new Set(items.map(item => item.productSlug).filter(Boolean))]
    const { rows } = await query(
      `SELECT p.id AS product_id, p.slug, p.name, b.name AS brand, pv.id AS variant_id, pv.color_name, pv.quantity AS quantity_value, pv.unit, pv.selling_price AS sell_price, pv.stock
       FROM products p
       JOIN brands b ON b.id=p.brand_id
       JOIN product_variants pv ON pv.product_id=p.id AND pv.id = ANY($2::uuid[]) AND pv.deleted_at IS NULL AND pv.is_active=true
       WHERE (p.id = ANY($1::uuid[]) OR p.slug = ANY($3::text[])) AND p.deleted_at IS NULL AND p.is_active=true`,
      [ids, [...new Set(items.map(item => item.variantId))], slugs]
    )
    return items.map(item => {
      const product = rows.find(row => (row.product_id === item.productId || row.slug === item.productSlug) && row.variant_id === item.variantId)
      if (!product) throw Object.assign(new Error('A product in your cart is no longer available. Please remove it and try again.'), { statusCode: 400, code: 'CART_PRODUCT_UNAVAILABLE' })
      if (Number(product.stock) < item.quantity) throw Object.assign(new Error('Insufficient stock for the selected variant'), { statusCode: 400 })
      return {
        ...product,
        size: product.quantity_value ? `${product.quantity_value} ${product.unit}` : '',
        color: product.color_name || '',
        selling_price: product.sell_price,
        quantity: item.quantity
      }
    })
  },

  async listOrders(userId, { page = 1, limit = 20, status }) {
    const offset = (page - 1) * limit
    const { rows } = await query(
      `SELECT id, order_number AS "orderNumber", created_at AS date, total, status, payment_status AS "paymentStatus",
        (SELECT COALESCE(sum(quantity),0)::int FROM order_items oi WHERE oi.order_id=orders.id) AS items,
        tracking_url AS "trackingLink", count(*) OVER()::int AS total_count
       FROM orders
       WHERE user_id=$1 AND deleted_at IS NULL AND ($2::text IS NULL OR status=$2)
       ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [userId, status || null, limit, offset]
    )
    return { items: rows.map(({ total_count, ...row }) => row), total: rows[0]?.total_count || 0 }
  },

  async getOrder(userId, id) {
    const order = await query(
      `SELECT orders.id, orders.order_number AS "orderNumber", orders.created_at AS date, orders.subtotal, orders.discount_amount AS "discountAmount",
        orders.shipping_amount AS "shippingAmount", orders.total, orders.status, orders.payment_status AS "paymentStatus", orders.tracking_url AS "trackingLink",
        orders.promo_code AS "promoCode",
        COALESCE(
          orders.shipping_address,
          CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object(
            'label', a.label,
            'fullName', a.full_name,
            'phone', a.phone,
            'addressLine1', a.address_line1,
            'addressLine2', a.address_line2,
            'city', a.city,
            'state', a.state,
            'pincode', a.pincode
          ) END
        ) AS "shippingAddress",
        u.name AS "customerName",
        u.email AS "customerEmail",
        u.phone AS "customerPhone"
       FROM orders
       LEFT JOIN users u ON u.id=orders.user_id
       LEFT JOIN user_addresses a ON a.id=orders.address_id
       WHERE orders.id=$1 AND orders.user_id=$2 AND orders.deleted_at IS NULL`,
      [id, userId]
    )
    if (!order.rows[0]) return null
    const items = await query(
      `SELECT oi.product_id AS "productId", oi.product_name AS name, oi.brand_name AS brand,
        oi.size, oi.color, oi.quantity AS qty, oi.unit_price AS "unitPrice",
        (SELECT image_url FROM product_images pi WHERE pi.product_id=oi.product_id ORDER BY sort_order LIMIT 1) AS image
       FROM order_items oi WHERE order_id=$1`,
      [id]
    )
    return { ...order.rows[0], products: items.rows }
  },

  async cancelOrder(userId, id) {
    const { rows } = await query(
      `UPDATE orders SET status='cancelled', updated_at=now()
       WHERE id=$1 AND user_id=$2 AND status IN ('pending','paid')
       RETURNING id, status`,
      [id, userId]
    )
    return rows[0]
  }
}

async function getAddressSnapshot(client, userId, addressId) {
  const { rows } = await client.query(
    `SELECT label, full_name AS "fullName", phone, address_line1 AS "addressLine1",
      address_line2 AS "addressLine2", city, state, pincode
     FROM user_addresses
     WHERE id=$1 AND user_id=$2
     LIMIT 1`,
    [addressId, userId]
  )
  if (!rows[0]) throw Object.assign(new Error('Delivery address not found'), { statusCode: 400 })
  return rows[0]
}
