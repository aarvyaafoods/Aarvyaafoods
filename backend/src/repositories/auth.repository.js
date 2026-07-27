import { query } from '../config/db.js'

export const authRepository = {
  async findUserByEmail(email) {
    const { rows } = await query(
      `SELECT u.*, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1 AND u.deleted_at IS NULL`,
      [email]
    )
    return rows[0]
  },

  async findUserById(id) {
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.status, u.is_active, u.created_at, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [id]
    )
    return rows[0]
  },

  async createUser({ name, email, phone, passwordHash }) {
    const { rows } = await query(
      `INSERT INTO users(role_id, name, email, phone, password_hash)
       VALUES ((SELECT id FROM roles WHERE name = 'customer'), $1, $2, $3, $4)
       RETURNING id, name, email, phone, status, is_active, created_at, role_id`,
      [name, email, phone || null, passwordHash]
    )
    return rows[0]
  },

  async findUserByGoogleId(googleId) {
    const { rows } = await query(
      `SELECT u.*, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.google_id = $1 AND u.deleted_at IS NULL`,
      [googleId]
    )
    return rows[0]
  },

  async createUserWithGoogle({ name, email, phone, googleId, passwordHash }) {
    const { rows } = await query(
      `INSERT INTO users(role_id, name, email, phone, password_hash, google_id)
       VALUES ((SELECT id FROM roles WHERE name = 'customer'), $1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, status, is_active, created_at, role_id`,
      [name, email, phone || null, passwordHash, googleId]
    )
    return rows[0]
  },

  async linkUserToGoogle(userId, googleId) {
    await query(`UPDATE users SET google_id = $1 WHERE id = $2`, [googleId, userId])
  },

  async saveRefreshToken({ userId, tokenHash, expiresAt }) {
    const { rows } = await query(
      `INSERT INTO refresh_tokens(user_id, token_hash, expires_at)
       VALUES ($1, $2, $3) RETURNING id`,
      [userId, tokenHash, expiresAt]
    )
    return rows[0]
  },

  async findRefreshToken(tokenHash) {
    const { rows } = await query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
      [tokenHash]
    )
    return rows[0]
  },

  async revokeRefreshToken(tokenHash) {
    await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`, [tokenHash])
  },

  async savePasswordReset({ userId, tokenHash, expiresAt }) {
    const { rows } = await query(
      `INSERT INTO password_reset_tokens(user_id, token_hash, expires_at)
       VALUES ($1, $2, $3) RETURNING id`,
      [userId, tokenHash, expiresAt]
    )
    return rows[0]
  },

  async consumePasswordReset(tokenHash, passwordHash) {
    const { rows } = await query(
      `WITH token AS (
         UPDATE password_reset_tokens
         SET used_at = now()
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
         RETURNING user_id
       )
       UPDATE users SET password_hash = $2, updated_at = now()
       WHERE id = (SELECT user_id FROM token)
       RETURNING id`,
      [tokenHash, passwordHash]
    )
    return rows[0]
  },

  async updatePassword(userId, passwordHash) {
    await query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`, [passwordHash, userId])
  }
}
