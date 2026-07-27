import { query } from '../config/db.js'

export const uploadRepository = {
  async create(data) {
    const { rows } = await query(
      `INSERT INTO uploads(uploaded_by, url, object_key, file_name, mime_type, size_bytes)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, url, object_key AS key, file_name AS "fileName", mime_type AS "mimeType", size_bytes AS "sizeBytes", created_at AS "createdAt"`,
      [data.uploadedBy, data.url, data.key, data.fileName, data.mimeType, data.sizeBytes]
    )
    return rows[0]
  },

  async find(id) {
    const { rows } = await query(`SELECT * FROM uploads WHERE id=$1 AND deleted_at IS NULL`, [id])
    return rows[0]
  },

  async update(id, patch) {
    const { rows } = await query(
      `UPDATE uploads SET status=COALESCE($2,status), is_active=COALESCE($3,is_active), updated_at=now()
       WHERE id=$1 RETURNING id, url, object_key AS key, status, is_active AS "isActive"`,
      [id, patch.status || null, patch.isActive ?? null]
    )
    return rows[0]
  },

  async softDelete(id) {
    await query(`UPDATE uploads SET deleted_at=now(), is_active=false, status='deleted' WHERE id=$1`, [id])
  }
}
