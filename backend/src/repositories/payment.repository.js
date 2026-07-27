import { query, transaction } from '../config/db.js'

export const paymentRepository = {
  async createPayment(data) {
    const { rows } = await query(
      `INSERT INTO payments(order_id, user_id, provider, provider_order_id, amount, currency, status)
       VALUES ($1,$2,'razorpay',$3,$4,$5,$6)
       RETURNING *`,
      [data.orderId, data.userId, data.providerOrderId, data.amount, data.currency || 'INR', data.status || 'pending']
    )
    return rows[0]
  },

  async markPaymentSuccess(data) {
    return transaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE payments SET provider_payment_id=$1, provider_signature=$2, status='success', paid_at=now(), updated_at=now()
         WHERE order_id=$3 AND provider_order_id=$4
         RETURNING *`,
        [data.razorpayPaymentId, data.razorpaySignature, data.orderId, data.razorpayOrderId]
      )
      if (!rows[0]) throw Object.assign(new Error('Payment record not found'), { statusCode: 404 })

      const paidOrder = await client.query(
        `UPDATE orders SET payment_status='paid', status='paid', updated_at=now()
         WHERE id=$1 AND payment_status <> 'paid'
         RETURNING id`,
        [data.orderId]
      )

      if (paidOrder.rows[0]) {
        const items = await client.query(
          `SELECT oi.product_id, oi.size, oi.color, oi.quantity, pv.id AS variant_id FROM order_items oi JOIN product_variants pv ON pv.product_id=oi.product_id AND concat(pv.quantity, ' ', pv.unit)=oi.size AND pv.color_name=oi.color WHERE oi.order_id=$1 AND oi.product_id IS NOT NULL`,
          [data.orderId]
        )
        for (const item of items.rows) {
          await client.query(`UPDATE product_variants SET stock=GREATEST(stock-$1,0), updated_at=now() WHERE id=$2`, [item.quantity, item.variant_id])
        }
      }

      await client.query(
        `INSERT INTO transactions(payment_id, type, status, amount, payload)
         VALUES ($1,'capture','success',$2,$3)`,
        [rows[0].id, rows[0].amount, data]
      )
      return rows[0]
    })
  },

  async markPaymentFailed(paymentId, payload) {
    const { rows } = await query(`UPDATE payments SET status='failed', failure_reason=$2, updated_at=now() WHERE id=$1 RETURNING *`, [paymentId, payload?.error?.description || 'Payment failed'])
    if (rows[0]) await this.createTransaction({ paymentId, type: 'failure', status: 'failed', amount: rows[0].amount, payload })
    return rows[0]
  },

  async createTransaction({ paymentId, type, status, amount, payload }) {
    const { rows } = await query(
      `INSERT INTO transactions(payment_id, type, status, amount, payload)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [paymentId, type, status, amount, payload || {}]
    )
    return rows[0]
  },

  async history(userId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit
    const { rows } = await query(
      `SELECT p.id, p.order_id AS "orderId", o.order_number AS "orderNumber", p.amount, p.currency,
        p.status, p.provider_order_id AS "razorpayOrderId", p.provider_payment_id AS "razorpayPaymentId",
        p.created_at AS "createdAt", count(*) OVER()::int AS total
       FROM payments p JOIN orders o ON o.id=p.order_id
       WHERE p.user_id=$1 ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    )
    return { items: rows.map(({ total, ...row }) => row), total: rows[0]?.total || 0 }
  }
}
