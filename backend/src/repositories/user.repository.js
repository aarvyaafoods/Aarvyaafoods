import { query } from '../config/db.js'

const sortable = new Set(['created_at', 'updated_at', 'name', 'email', 'status'])
const dir = (value) => value?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

export const userRepository = {
  async updateProfile(userId, patch) {
    const { rows } = await query(
      `UPDATE users
       SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = now()
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING id, name, email, phone, status, is_active, created_at`,
      [patch.name || null, patch.phone || null, userId]
    )
    return rows[0]
  },

  async getAddresses(userId) {
    const { rows } = await query(
      `SELECT id, label, full_name AS "fullName", phone, address_line1 AS "addressLine1",
        address_line2 AS "addressLine2", city, state, pincode, is_default AS "isDefault"
       FROM user_addresses
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    )
    return rows
  },

  async createAddress(userId, data) {
    const { rows } = await query(
      `INSERT INTO user_addresses(user_id, label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, label, full_name AS "fullName", phone, address_line1 AS "addressLine1",
        address_line2 AS "addressLine2", city, state, pincode, is_default AS "isDefault"`,
      [userId, data.label, data.fullName, data.phone || null, data.addressLine1, data.addressLine2 || null, data.city, data.state || null, data.pincode, data.isDefault]
    )
    if (data.isDefault) await this.setDefaultAddress(userId, rows[0].id)
    return rows[0]
  },

  async updateAddress(userId, id, data) {
    const { rows } = await query(
      `UPDATE user_addresses SET label=$1, full_name=$2, phone=$3, address_line1=$4, address_line2=$5,
       city=$6, state=$7, pincode=$8, updated_at=now()
       WHERE id=$9 AND user_id=$10 AND deleted_at IS NULL
       RETURNING id, label, full_name AS "fullName", phone, address_line1 AS "addressLine1",
        address_line2 AS "addressLine2", city, state, pincode, is_default AS "isDefault"`,
      [data.label, data.fullName, data.phone || null, data.addressLine1, data.addressLine2 || null, data.city, data.state || null, data.pincode, id, userId]
    )
    return rows[0]
  },

  async deleteAddress(userId, id) {
    await query(`UPDATE user_addresses SET deleted_at=now(), is_active=false WHERE id=$1 AND user_id=$2`, [id, userId])
  },

  async setDefaultAddress(userId, id) {
    await query(`UPDATE user_addresses SET is_default=false WHERE user_id=$1`, [userId])
    const { rows } = await query(
      `UPDATE user_addresses SET is_default=true, updated_at=now()
       WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL RETURNING id`,
      [id, userId]
    )
    return rows[0]
  },

  async getNotificationPrefs(userId) {
    await query(`INSERT INTO user_notification_preferences(user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId])
    const { rows } = await query(
      `SELECT email_order_updates AS email, promo_offers AS promo, whatsapp, sms
       FROM user_notification_preferences WHERE user_id=$1`,
      [userId]
    )
    return rows[0]
  },

  async updateNotificationPrefs(userId, data) {
    const { rows } = await query(
      `INSERT INTO user_notification_preferences(user_id, email_order_updates, promo_offers, whatsapp, sms)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id) DO UPDATE SET
        email_order_updates=$2, promo_offers=$3, whatsapp=$4, sms=$5, updated_at=now()
       RETURNING email_order_updates AS email, promo_offers AS promo, whatsapp, sms`,
      [userId, data.email, data.promo, data.whatsapp, data.sms]
    )
    return rows[0]
  },

  async listUsers({ page, limit, search, sortBy, sortDir, status }) {
    page = Number(page) || 1
    limit = Number(limit) || 20
    const offset = (page - 1) * limit
    const sort = sortable.has(sortBy) ? sortBy : 'created_at'
    const params = [`%${search || ''}%`, status || null, limit, offset]
    const { rows } = await query(
      `SELECT id, name, email, phone, status, is_active, created_at, count(*) OVER()::int AS total
       FROM users
       WHERE deleted_at IS NULL AND ($1 = '%%' OR name ILIKE $1 OR email ILIKE $1) AND ($2::text IS NULL OR status=$2)
       ORDER BY ${sort} ${dir(sortDir)} LIMIT $3 OFFSET $4`,
      params
    )
    return { items: rows.map(({ total, ...row }) => row), total: rows[0]?.total || 0 }
  }
}
