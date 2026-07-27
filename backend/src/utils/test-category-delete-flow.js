import { adminRepository } from '../repositories/admin.repository.js'
import { pool, query } from '../config/db.js'

const stamp = Date.now()
const catSlug = `codex-delete-test-${stamp}`
const brandName = `Codex Delete Test Brand ${stamp}`

let categoryId
let brandId

try {
  const brand = await query('INSERT INTO brands(name) VALUES ($1) RETURNING id', [brandName])
  brandId = brand.rows[0].id

  const category = await query(
    'INSERT INTO categories(name, slug, sort_order) VALUES ($1,$2,$3) RETURNING id',
    ['Codex Delete Test', catSlug, 9999]
  )
  categoryId = category.rows[0].id

  await query(
    'INSERT INTO category_subcategories(category_id, name, slug, sort_order) VALUES ($1,$2,$3,$4),($1,$5,$6,$7)',
    [categoryId, 'Alpha', 'alpha', 1, 'Beta', 'beta', 2]
  )

  await query(
    `INSERT INTO products(category_id, brand_id, name, slug, subcategory, sell_price, mrp, stock)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8),($1,$2,$9,$10,$11,$12,$13,$14)`,
    [
      categoryId,
      brandId,
      'Codex Delete Product A',
      `${catSlug}-a`,
      'alpha',
      10,
      10,
      1,
      'Codex Delete Product B',
      `${catSlug}-b`,
      'beta',
      20,
      20,
      1
    ]
  )

  const impact = await adminRepository.categoryDeleteImpact(categoryId)
  const deleted = await adminRepository.deleteCategory(categoryId)
  const verify = await query(
    `SELECT
      (SELECT count(*)::int FROM categories WHERE id=$1 AND deleted_at IS NOT NULL) AS category_deleted,
      (SELECT count(*)::int FROM products WHERE category_id=$1 AND deleted_at IS NOT NULL) AS products_deleted`,
    [categoryId]
  )

  console.log(JSON.stringify({
    impactTotal: impact.totalProducts,
    impactSubcategories: impact.subcategories,
    deletedTotal: deleted.impact.totalProducts,
    verify: verify.rows[0]
  }))
} finally {
  if (categoryId) {
    await query('DELETE FROM products WHERE category_id=$1', [categoryId]).catch(() => {})
    await query('DELETE FROM category_subcategories WHERE category_id=$1', [categoryId]).catch(() => {})
    await query('DELETE FROM categories WHERE id=$1', [categoryId]).catch(() => {})
  }
  if (brandId) await query('DELETE FROM brands WHERE id=$1', [brandId]).catch(() => {})
  await pool.end()
}
