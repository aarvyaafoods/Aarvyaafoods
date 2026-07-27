import { query, transaction } from '../config/db.js'
import { normalizeTheme } from '../utils/theme.js'

const pageParams = ({ page = 1, limit = 20 }) => {
  const safePage = Math.max(Number(page) || 1, 1)
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
  return { limit: safeLimit, offset: (safePage - 1) * safeLimit }
}

export const adminRepository = {
  async dashboard() {
    const [orders, customers, products, revenue, subscriptions] = await Promise.all([
      query(`SELECT count(*)::int AS value FROM orders WHERE deleted_at IS NULL`).then(r => r.rows[0].value).catch(() => 0),
      query(`SELECT count(*)::int AS value FROM users u JOIN roles r ON r.id=u.role_id WHERE u.deleted_at IS NULL AND r.name='customer'`).then(r => r.rows[0].value).catch(() => 0),
      query(`SELECT count(*)::int AS value FROM products WHERE deleted_at IS NULL`).then(r => r.rows[0].value).catch(() => 0),
      query(`SELECT COALESCE(sum(total),0)::numeric AS value FROM orders WHERE deleted_at IS NULL AND status IN ('paid','confirmed')`).then(r => r.rows[0].value).catch(() => 0),
      query(`SELECT count(*)::int AS value FROM newsletter_subscriptions WHERE deleted_at IS NULL`).then(r => r.rows[0].value).catch(() => 0),
    ])
    return { orders, customers, products, revenue, subscriptions }
  },

  async product(id) {
    const { rows } = await query(
      `SELECT p.id, p.category_id AS "categoryId", c.slug AS category, p.brand_id AS "brandId", b.name AS brand,
        p.name, p.slug, p.subcategory, p.tag, p.offer_tag AS "offerTag", p.description, p.is_featured AS "isFeatured",
          p.ingredients AS "ingredients", p.storage_instructions AS "storageInstructions", p.shelf_life AS "shelfLife", p.fssai_license_number AS "fssaiLicenseNumber", p.veg_non_veg AS "vegNonVeg", p.organic, p.best_before AS "bestBefore", p.allergen_information AS "allergenInformation", p.spice_level AS "spiceLevel", p.sweetness_level AS "sweetnessLevel", p.highlights->>'shippingDetails' AS "shippingDetails", p.sell_price AS "sellPrice", p.mrp, p.discount_percent AS off, p.stock,
        p.rating, p.reviews, p.status, p.is_active AS "isActive",
        COALESCE((SELECT json_agg(json_build_object('id', id, 'url', image_url, 'alt', alt_text, 'sortOrder', sort_order) ORDER BY sort_order) FROM product_images WHERE product_id=p.id AND deleted_at IS NULL), '[]') AS images,
        COALESCE((SELECT json_agg(json_build_object('id', id, 'name', name, 'hex', hex, 'imageIndex', image_index, 'sortOrder', sort_order) ORDER BY sort_order) FROM product_colors WHERE product_id=p.id AND deleted_at IS NULL), '[]') AS colors,
        COALESCE((SELECT json_agg(json_build_object('id', id, 'size', size, 'stock', stock, 'sortOrder', sort_order) ORDER BY sort_order) FROM product_sizes WHERE product_id=p.id AND deleted_at IS NULL), '[]') AS sizes,
        COALESCE((SELECT json_agg(json_build_object('colorName', color_name, 'colorHex', color_hex, 'imageUrl', image_url, 'sortOrder', sort_order) ORDER BY sort_order) FROM product_color_images WHERE product_id=p.id AND deleted_at IS NULL), '[]') AS "colorImages",
        COALESCE((SELECT json_agg(json_build_object('id', id, 'colorName', color_name, 'colorHex', color_hex, 'quantity', quantity, 'unit', unit, 'mrp', mrp, 'sellingPrice', selling_price, 'stock', stock, 'sortOrder', sort_order) ORDER BY sort_order) FROM product_variants WHERE product_id=p.id AND deleted_at IS NULL), '[]') AS variants
       FROM products p
       JOIN categories c ON c.id=p.category_id
       JOIN brands b ON b.id=p.brand_id
       WHERE p.id=$1 AND p.deleted_at IS NULL`,
      [id]
    )
    const row = rows[0]
    if (!row) return null
    return row
  },

  async saveProduct(data, id = null) {
    return transaction(async (client) => {
      const variants = normalizeGroceryVariants(data)
      const category = await client.query(`SELECT id FROM categories WHERE id=$1 OR slug=$2 LIMIT 1`, [data.categoryId || null, data.category || null])
      if (!category.rows[0]) throw Object.assign(new Error('Category is required'), { statusCode: 400 })
      const categoryId = category.rows[0].id
      const subcategory = data.subcategory || 'general'
      await client.query(
        `INSERT INTO category_subcategories(category_id, name, slug)
         VALUES ($1,$2,$3)
         ON CONFLICT (category_id, slug) DO UPDATE SET name=EXCLUDED.name, deleted_at=NULL, is_active=true, status='active', updated_at=now()`,
        [categoryId, titleize(subcategory), subcategory]
      )
      const brand = await client.query(
        `INSERT INTO brands(name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET updated_at=now()
         RETURNING id`,
        [data.brand || 'Aarvya']
      )
      const sellPrice = Number(data.sellPrice) || Math.min(...variants.map(variant => variant.sellingPrice))
      const mrp = Math.max(Number(data.mrp) || sellPrice, sellPrice)
      const discountPercent = mrp > sellPrice ? Math.round(((mrp - sellPrice) / mrp) * 100) : 0
      const stock = variants.reduce((sum, variant) => sum + variant.stock, 0)
      const values = [
        categoryId, brand.rows[0].id, data.name, data.slug, subcategory,
        sellPrice, mrp, Number(data.off ?? data.discountPercent ?? discountPercent), data.tag || null, data.offerTag || null,
        stock, null, JSON.stringify({ shippingDetails: data.shippingDetails || '' }), null, data.description || null, Boolean(data.isFeatured),
        Number(data.rating || 0), Number(data.reviews || 0), data.status || 'active', data.isActive !== false,
        data.ingredients || null, data.storageInstructions || null, data.shelfLife || null, data.fssaiLicenseNumber || null, data.vegNonVeg || null, data.organic ?? null, data.bestBefore || null, data.allergenInformation || null, data.spiceLevel || null, data.sweetnessLevel || null
      ]
      const product = id
        ? await client.query(
            `UPDATE products SET category_id=$1, brand_id=$2, name=$3, slug=$4, subcategory=$5, sell_price=$6, mrp=$7,
              discount_percent=$8, tag=$9, offer_tag=$10, stock=$11, material=$12, highlights=$13, care=$14, description=$15,
              is_featured=$16, rating=$17, reviews=$18, status=$19, is_active=$20, ingredients=$21, storage_instructions=$22, shelf_life=$23, fssai_license_number=$24, veg_non_veg=$25, organic=$26, best_before=$27, allergen_information=$28, spice_level=$29, sweetness_level=$30, updated_at=now()
             WHERE id=$31 AND deleted_at IS NULL RETURNING *`,
            [...values, id]
        )
        : await client.query(
            `INSERT INTO products(category_id, brand_id, name, slug, subcategory, sell_price, mrp, discount_percent, tag, offer_tag, stock, material, highlights, care, description, is_featured, rating, reviews, status, is_active, ingredients, storage_instructions, shelf_life, fssai_license_number, veg_non_veg, organic, best_before, allergen_information, spice_level, sweetness_level)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
             RETURNING *`,
            values
        )
      const productId = product.rows[0].id

      const imageUrls = []
      const urlIndex = new Map()
      const addImage = (url) => {
        if (!url || urlIndex.has(url)) return urlIndex.get(url)
        const index = imageUrls.length
        imageUrls.push(url)
        urlIndex.set(url, index)
        return index
      }

      ;(data.colorVariants || []).forEach(color => (color.images || []).filter(Boolean).forEach(addImage))
      ;(data.images || []).filter(Boolean).forEach(image => addImage(typeof image === 'string' ? image : image.url))

      await client.query(`DELETE FROM product_images WHERE product_id=$1`, [productId])
      for (const [index, url] of imageUrls.entries()) {
        await client.query(
          `INSERT INTO product_images(product_id, image_url, alt_text, sort_order) VALUES ($1,$2,$3,$4)`,
          [productId, url, data.name, index + 1]
        )
      }

      await client.query(`DELETE FROM product_colors WHERE product_id=$1`, [productId])
      for (const [index, color] of (data.colorVariants || []).entries()) {
        if (!color?.name || !color?.hex) continue
        await client.query(
          `INSERT INTO catalog_colors(name, hex, sort_order)
           VALUES ($1,$2,$3)
           ON CONFLICT (name, hex) DO UPDATE SET deleted_at=NULL, is_active=true, status='active', updated_at=now()`,
          [color.name, color.hex, index + 1]
        )
        const firstImage = (color.images || []).find(Boolean)
        await client.query(
          `INSERT INTO product_colors(product_id, name, hex, image_index, sort_order) VALUES ($1,$2,$3,$4,$5)`,
          [productId, color.name, color.hex, firstImage ? addImage(firstImage) : 0, index + 1]
        )
      }

      await client.query(`DELETE FROM product_color_images WHERE product_id=$1`, [productId])
      let colorImageOrder = 1
      for (const color of (data.colorVariants || [])) {
        if (!color?.name || !color?.hex) continue
        for (const url of (color.images || []).filter(Boolean)) {
          await client.query(
            `INSERT INTO product_color_images(product_id, color_name, color_hex, image_url, sort_order) VALUES ($1,$2,$3,$4,$5)`,
            [productId, color.name, color.hex, url, colorImageOrder++]
          )
        }
      }

      await client.query(`DELETE FROM product_variants WHERE product_id=$1`, [productId])
      let variantOrder = 1
      for (const variant of variants) {
        await client.query(
          `INSERT INTO product_variants(product_id, color_name, color_hex, size, stock, quantity, unit, mrp, selling_price, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [productId, variant.colorName || 'Option', variant.colorHex || '#111111', `${variant.quantity} ${variant.unit}`, variant.stock, variant.quantity, variant.unit, variant.mrp, variant.sellingPrice, variantOrder++]
        )
      }

      const sizeStockMap = new Map()
      variants.forEach(variant => sizeStockMap.set(`${variant.quantity} ${variant.unit}`, variant.stock))
      const legacySizes = sizeStockMap.size
        ? [...sizeStockMap.entries()].map(([size, stock]) => ({ size, stock }))
        : (data.sizes || [])

      await client.query(`DELETE FROM product_sizes WHERE product_id=$1`, [productId])
      for (const [index, size] of legacySizes.entries()) {
        if (!size?.size) continue
        await client.query(
          `INSERT INTO catalog_sizes(size, sort_order)
           VALUES ($1,$2)
           ON CONFLICT (size) DO UPDATE SET deleted_at=NULL, is_active=true, status='active', updated_at=now()`,
          [size.size, index + 1]
        )
        await client.query(
          `INSERT INTO product_sizes(product_id, size, stock, sort_order) VALUES ($1,$2,$3,$4)`,
          [productId, size.size, Number(size.stock || 0), index + 1]
        )
      }
      return { id: productId }
    })
  },

  async deleteProduct(id) {
    const { rows } = await query(`UPDATE products SET deleted_at=now(), is_active=false, updated_at=now() WHERE id=$1 RETURNING id`, [id])
    return rows[0]
  },

  async categories() {
    const { rows } = await query(
      `SELECT c.id, c.name, c.slug, c.image_url AS "imageUrl", c.sort_order AS "sortOrder", c.status, c.is_active AS "isActive",
        COALESCE((
          SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'sortOrder', s.sort_order, 'status', s.status, 'isActive', s.is_active) ORDER BY s.sort_order, s.name)
          FROM category_subcategories s
          WHERE s.category_id=c.id AND s.deleted_at IS NULL
        ), '[]') AS subcategories
       FROM categories c
       WHERE c.deleted_at IS NULL
       ORDER BY c.sort_order, c.name`
    )
    return rows
  },

  async saveCategory(data, id = null) {
    return transaction(async (client) => {
      const args = [data.name, data.slug, data.imageUrl || data.img || null, Number(data.sortOrder || 0), data.status || 'active', data.isActive !== false]
      const { rows } = id
        ? await client.query(`UPDATE categories SET name=$1, slug=$2, image_url=$3, sort_order=$4, status=$5, is_active=$6, updated_at=now() WHERE id=$7 RETURNING id`, [...args, id])
        : await client.query(`INSERT INTO categories(name, slug, image_url, sort_order, status, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, args)
      const categoryId = rows[0].id
      await syncSubcategories(client, categoryId, data.subcategories || [])
      const saved = await client.query(
        `SELECT c.id, c.name, c.slug, c.image_url AS "imageUrl", c.sort_order AS "sortOrder", c.status, c.is_active AS "isActive",
          COALESCE((
            SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'sortOrder', s.sort_order, 'status', s.status, 'isActive', s.is_active) ORDER BY s.sort_order, s.name)
            FROM category_subcategories s
            WHERE s.category_id=c.id AND s.deleted_at IS NULL
          ), '[]') AS subcategories
         FROM categories c
         WHERE c.id=$1`,
        [categoryId]
      )
      return saved.rows[0]
    })
  },

  async deleteCategory(id) {
    return transaction(async (client) => {
      const impact = await getCategoryDeleteImpact(client, id)
      if (!impact.category) return null
      await client.query(
        `UPDATE products SET deleted_at=now(), is_active=false, status='deleted', updated_at=now()
         WHERE category_id=$1 AND deleted_at IS NULL`,
        [id]
      )
      await client.query(
        `UPDATE category_subcategories SET deleted_at=now(), is_active=false, status='deleted', updated_at=now()
         WHERE category_id=$1 AND deleted_at IS NULL`,
        [id]
      )
      const { rows } = await client.query(
        `UPDATE categories SET deleted_at=now(), is_active=false, status='deleted', updated_at=now()
         WHERE id=$1 AND deleted_at IS NULL
         RETURNING id`,
        [id]
      )
      return rows[0] ? { ...rows[0], impact } : null
    })
  },

  async categoryDeleteImpact(id) {
    return getCategoryDeleteImpact({ query }, id)
  },

  async colors() {
    const { rows } = await query(`SELECT id, name, hex, sort_order AS "sortOrder", status, is_active AS "isActive" FROM catalog_colors WHERE deleted_at IS NULL ORDER BY sort_order, name`)
    return rows
  },

  async saveColor(data, id = null) {
    const args = [data.name, data.hex || '#111111', Number(data.sortOrder || 0), data.status || 'active', data.isActive !== false]
    const { rows } = id
      ? await query(`UPDATE catalog_colors SET name=$1, hex=$2, sort_order=$3, status=$4, is_active=$5, updated_at=now() WHERE id=$6 AND deleted_at IS NULL RETURNING id, name, hex, sort_order AS "sortOrder", status, is_active AS "isActive"`, [...args, id])
      : await query(`INSERT INTO catalog_colors(name, hex, sort_order, status, is_active) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (name, hex) DO UPDATE SET sort_order=$3, status=$4, is_active=$5, deleted_at=NULL, updated_at=now() RETURNING id, name, hex, sort_order AS "sortOrder", status, is_active AS "isActive"`, args)
    return rows[0]
  },

  async deleteColor(id) {
    const { rows } = await query(`UPDATE catalog_colors SET deleted_at=now(), is_active=false, status='deleted', updated_at=now() WHERE id=$1 RETURNING id`, [id])
    return rows[0]
  },

  async sizes() {
    const { rows } = await query(`SELECT id, size, sort_order AS "sortOrder", status, is_active AS "isActive" FROM catalog_sizes WHERE deleted_at IS NULL ORDER BY sort_order, size`)
    return rows
  },

  async saveSize(data, id = null) {
    const args = [data.size, Number(data.sortOrder || 0), data.status || 'active', data.isActive !== false]
    const { rows } = id
      ? await query(`UPDATE catalog_sizes SET size=$1, sort_order=$2, status=$3, is_active=$4, updated_at=now() WHERE id=$5 AND deleted_at IS NULL RETURNING id, size, sort_order AS "sortOrder", status, is_active AS "isActive"`, [...args, id])
      : await query(`INSERT INTO catalog_sizes(size, sort_order, status, is_active) VALUES ($1,$2,$3,$4) ON CONFLICT (size) DO UPDATE SET sort_order=$2, status=$3, is_active=$4, deleted_at=NULL, updated_at=now() RETURNING id, size, sort_order AS "sortOrder", status, is_active AS "isActive"`, args)
    return rows[0]
  },

  async deleteSize(id) {
    const { rows } = await query(`UPDATE catalog_sizes SET deleted_at=now(), is_active=false, status='deleted', updated_at=now() WHERE id=$1 RETURNING id`, [id])
    return rows[0]
  },

  async heroBanners() {
    const { rows } = await query(`SELECT id, kicker, title, subtitle, cta_label AS "ctaLabel", cta_link AS "ctaLink", image_url AS "imageUrl", video_url AS "videoUrl", sort_order AS "sortOrder", status, is_active AS "isActive" FROM hero_banners WHERE deleted_at IS NULL ORDER BY sort_order, created_at`)
    return rows
  },

  async saveHeroBanner(data, id = null) {
    const args = [data.kicker || null, data.title, data.subtitle || null, data.ctaLabel || data.cta || null, data.ctaLink || '/plp', data.imageUrl || data.img, data.videoUrl || data.video || null, Number(data.sortOrder || 0), data.status || 'active', data.isActive !== false]
    const sql = id
      ? `UPDATE hero_banners SET kicker=$1, title=$2, subtitle=$3, cta_label=$4, cta_link=$5, image_url=$6, video_url=$7, sort_order=$8, status=$9, is_active=$10, updated_at=now() WHERE id=$11 RETURNING id`
      : `INSERT INTO hero_banners(kicker, title, subtitle, cta_label, cta_link, image_url, video_url, sort_order, status, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`
    const { rows } = await query(sql, id ? [...args, id] : args)
    return rows[0]
  },

  async deleteHeroBanner(id) {
    const { rows } = await query(`UPDATE hero_banners SET deleted_at=now(), is_active=false WHERE id=$1 RETURNING id`, [id])
    return rows[0]
  },

  async orders(filters = {}) {
    const { limit, offset } = pageParams(filters)
    const { fromDate, toDate } = resolveOrderDateRange(filters)
    const { rows } = await query(
      `SELECT o.id, o.order_number AS "orderNumber", o.created_at AS "createdAt", o.total, o.status,
        o.payment_method AS "paymentMethod", o.payment_status AS "paymentStatus",
        u.name AS "customerName", u.email AS "customerEmail", u.phone AS "customerPhone",
        (SELECT count(*)::int FROM order_items oi WHERE oi.order_id=o.id) AS "itemCount",
        count(*) OVER()::int AS total_count
       FROM orders o
       JOIN users u ON u.id=o.user_id
       WHERE o.deleted_at IS NULL
         AND ($1::text IS NULL OR o.status=$1)
         AND ($2::text IS NULL OR o.payment_status=$2)
         AND ($3::text IS NULL OR o.order_number ILIKE $3 OR u.email ILIKE $3 OR u.name ILIKE $3 OR u.phone ILIKE $3)
         AND ($4::timestamptz IS NULL OR o.created_at >= $4)
         AND ($5::timestamptz IS NULL OR o.created_at <= $5)
       ORDER BY o.created_at DESC
       LIMIT $6 OFFSET $7`,
      [
        filters.status || null,
        filters.paymentStatus || null,
        filters.search ? `%${filters.search}%` : null,
        fromDate,
        toDate,
        limit,
        offset
      ]
    )
    return { items: rows.map(({ total_count, ...row }) => row), total: rows[0]?.total_count || 0 }
  },

  async getOrder(id) {
    const { rows } = await query(
      `SELECT o.id, o.order_number AS "orderNumber", o.created_at AS "createdAt", o.subtotal,
        o.discount_amount AS "discountAmount", o.shipping_amount AS "shippingAmount", o.total, o.status,
        o.payment_method AS "paymentMethod", o.payment_status AS "paymentStatus", o.tracking_url AS "trackingUrl",
        o.promo_code AS "promoCode",
        COALESCE(
          o.shipping_address,
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
        u.name AS "customerName", u.email AS "customerEmail", u.phone AS "customerPhone"
       FROM orders o
       JOIN users u ON u.id=o.user_id
       LEFT JOIN user_addresses a ON a.id=o.address_id
       WHERE o.id=$1 AND o.deleted_at IS NULL`,
      [id]
    )
    if (!rows[0]) return null
    const items = await query(
      `SELECT oi.product_id AS "productId", oi.product_name AS name, oi.brand_name AS brand,
        oi.size, oi.color, oi.quantity AS qty, oi.unit_price AS "unitPrice", oi.total_price AS "totalPrice",
        (SELECT image_url FROM product_images pi WHERE pi.product_id=oi.product_id AND pi.deleted_at IS NULL ORDER BY sort_order LIMIT 1) AS image
       FROM order_items oi WHERE oi.order_id=$1`,
      [id]
    )
    return { ...rows[0], products: items.rows }
  },

  async bulkUpdateOrders(ids = [], patch = {}) {
    if (!ids.length) return { updated: 0 }
    const { rows } = await query(
      `UPDATE orders
       SET status=COALESCE($2, status), payment_status=COALESCE($3, payment_status), updated_at=now()
       WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL
       RETURNING id`,
      [ids, patch.status || null, patch.paymentStatus || null]
    )
    return { updated: rows.length, ids: rows.map(row => row.id) }
  },

  async exportOrdersCsv(filters = {}) {
    const { fromDate, toDate } = resolveOrderDateRange(filters)
    const ids = filters.ids
      ? String(filters.ids).split(',').map(item => item.trim()).filter(Boolean)
      : null
    const { rows } = await query(
      `SELECT o.order_number AS "orderNumber", o.created_at AS "createdAt", o.status,
        o.payment_status AS "paymentStatus", o.payment_method AS "paymentMethod",
        o.subtotal, o.discount_amount AS "discountAmount", o.shipping_amount AS "shippingAmount",
        o.total, o.promo_code AS "promoCode",
        u.name AS "customerName", u.email AS "customerEmail", u.phone AS "customerPhone",
        (SELECT count(*)::int FROM order_items oi WHERE oi.order_id=o.id) AS "itemCount",
        (SELECT string_agg(oi.product_name || ' (Size: ' || oi.size || ', Qty: ' || oi.quantity || ')', ' | ')
         FROM order_items oi WHERE oi.order_id=o.id) AS "itemsSummary"
       FROM orders o
       JOIN users u ON u.id=o.user_id
       WHERE o.deleted_at IS NULL
         AND ($1::uuid[] IS NULL OR o.id = ANY($1::uuid[]))
         AND ($2::text IS NULL OR o.status=$2)
         AND ($3::text IS NULL OR o.payment_status=$3)
         AND ($4::text IS NULL OR o.order_number ILIKE $4 OR u.email ILIKE $4 OR u.name ILIKE $4 OR u.phone ILIKE $4)
         AND ($5::timestamptz IS NULL OR o.created_at >= $5)
         AND ($6::timestamptz IS NULL OR o.created_at <= $6)
       ORDER BY o.created_at DESC
       LIMIT 5000`,
      [
        ids?.length ? ids : null,
        filters.status || null,
        filters.paymentStatus || null,
        filters.search ? `%${filters.search}%` : null,
        fromDate,
        toDate
      ]
    )
    const header = [
      'Order Number', 'Date', 'Customer Name', 'Email', 'Phone', 'Items Count', 'Items',
      'Subtotal', 'Discount', 'Shipping', 'Total', 'Promo Code', 'Payment Method', 'Payment Status', 'Order Status'
    ]
    const lines = rows.map(row => [
      row.orderNumber,
      row.createdAt ? new Date(row.createdAt).toISOString() : '',
      row.customerName,
      row.customerEmail,
      row.customerPhone || '',
      row.itemCount || 0,
      row.itemsSummary || '',
      row.subtotal,
      row.discountAmount,
      row.shippingAmount,
      row.total,
      row.promoCode || '',
      row.paymentMethod || '',
      row.paymentStatus || '',
      row.status || ''
    ].map(value => {
      const text = String(value ?? '')
      return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
    }).join(','))
    return `\uFEFF${header.join(',')}\n${lines.join('\n')}`
  },

  async updateOrder(id, patch) {
    const { rows } = await query(
      `UPDATE orders
       SET status=COALESCE($2,status), payment_status=COALESCE($3,payment_status), tracking_url=COALESCE($4,tracking_url), updated_at=now()
       WHERE id=$1 AND deleted_at IS NULL
       RETURNING id, order_number AS "orderNumber", status, payment_status AS "paymentStatus", tracking_url AS "trackingUrl"`,
      [id, patch.status || null, patch.paymentStatus || null, patch.trackingUrl || null]
    )
    return rows[0]
  },

  async updateUser(id, patch) {
    const { rows } = await query(
      `UPDATE users SET status=COALESCE($2,status), is_active=COALESCE($3,is_active), updated_at=now()
       WHERE id=$1 AND deleted_at IS NULL
       RETURNING id, name, email, phone, status, is_active, created_at`,
      [id, patch.status || null, typeof patch.isActive === 'boolean' ? patch.isActive : null]
    )
    return rows[0]
  },

  async subscriptions(filters = {}) {
    const { limit, offset } = pageParams(filters)
    const { rows } = await query(
      `SELECT id, email, source, status, is_active AS "isActive", created_at AS "createdAt", count(*) OVER()::int AS total_count
       FROM newsletter_subscriptions
       WHERE deleted_at IS NULL AND ($1::text IS NULL OR email ILIKE $1)
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [filters.search ? `%${filters.search}%` : null, limit, offset]
    ).catch(() => ({ rows: [] }))
    return { items: rows.map(({ total_count, ...row }) => row), total: rows[0]?.total_count || 0 }
  },

  async saveSubscription(data, id = null) {
    const args = [data.email, data.source || 'admin', data.status || 'active', data.isActive !== false]
    const { rows } = id
      ? await query(`UPDATE newsletter_subscriptions SET email=$1, source=$2, status=$3, is_active=$4, updated_at=now() WHERE id=$5 AND deleted_at IS NULL RETURNING id, email, source, status, is_active AS "isActive", created_at AS "createdAt"`, [...args, id])
      : await query(`INSERT INTO newsletter_subscriptions(email, source, status, is_active) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO UPDATE SET source=$2, status=$3, is_active=$4, deleted_at=NULL, updated_at=now() RETURNING id, email, source, status, is_active AS "isActive", created_at AS "createdAt"`, args)
    return rows[0]
  },

  async deleteSubscription(id) {
    const { rows } = await query(`UPDATE newsletter_subscriptions SET deleted_at=now(), is_active=false, status='deleted', updated_at=now() WHERE id=$1 RETURNING id`, [id])
    return rows[0]
  },

  async coupons(filters = {}) {
    const { limit, offset } = pageParams(filters)
    const { rows } = await query(
      `SELECT id, code, type, value, min_cart AS "minCart", description, starts_at AS "startsAt", ends_at AS "endsAt",
        status, is_active AS "isActive", created_at AS "createdAt", count(*) OVER()::int AS total_count
       FROM promo_codes
       WHERE deleted_at IS NULL AND ($1::text IS NULL OR code ILIKE $1 OR description ILIKE $1)
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [filters.search ? `%${filters.search}%` : null, limit, offset]
    )
    return { items: rows.map(({ total_count, ...row }) => row), total: rows[0]?.total_count || 0 }
  },

  async saveCoupon(data, id = null) {
    const code = String(data.code || '').trim().toUpperCase()
    if (!code) throw Object.assign(new Error('Coupon code is required'), { statusCode: 400 })
    const type = data.type || 'percentage'
    const normalizeDate = (value) => {
      const raw = value ?? null
      if (!raw || !String(raw).trim()) return null
      return raw
    }
    const status = data.status || 'active'
    const args = [
      code,
      type,
      Number(data.value || 0),
      Number(data.minCart ?? data.min_cart ?? 0),
      data.description || null,
      normalizeDate(data.startsAt || data.starts_at),
      normalizeDate(data.endsAt || data.ends_at),
      status,
      data.isActive !== false && status === 'active'
    ]
    const { rows } = id
      ? await query(
        `UPDATE promo_codes SET code=$1, type=$2, value=$3, min_cart=$4, description=$5, starts_at=$6, ends_at=$7,
          status=$8, is_active=$9, updated_at=now()
         WHERE id=$10 AND deleted_at IS NULL
         RETURNING id, code, type, value, min_cart AS "minCart", description, starts_at AS "startsAt", ends_at AS "endsAt", status, is_active AS "isActive"`,
        [...args, id]
      )
      : await query(
        `INSERT INTO promo_codes(code, type, value, min_cart, description, starts_at, ends_at, status, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (code) DO UPDATE SET type=$2, value=$3, min_cart=$4, description=$5, starts_at=$6, ends_at=$7,
          status=$8, is_active=$9, deleted_at=NULL, updated_at=now()
         RETURNING id, code, type, value, min_cart AS "minCart", description, starts_at AS "startsAt", ends_at AS "endsAt", status, is_active AS "isActive"`,
        args
      )
    return rows[0]
  },

  async deleteCoupon(id) {
    const { rows } = await query(`UPDATE promo_codes SET deleted_at=now(), is_active=false, status='deleted', updated_at=now() WHERE id=$1 RETURNING id`, [id])
    return rows[0]
  },

  async settings() {
    const { rows } = await query(`SELECT key, value FROM site_settings WHERE deleted_at IS NULL AND is_active=true ORDER BY key`)
    return Object.fromEntries(rows.map(row => [row.key, row.value]))
  },

  async updateSetting(key, value) {
    const { rows } = await query(
      `INSERT INTO site_settings(key, value)
       VALUES ($1,$2)
       ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=now(), deleted_at=NULL, is_active=true
       RETURNING key, value`,
      [key, value]
    )
    return rows[0]
  },

  async getTheme() {
    const { rows } = await query(
      `SELECT value FROM site_settings WHERE key='store_theme' AND deleted_at IS NULL AND is_active=true LIMIT 1`
    )
    return normalizeTheme(rows[0]?.value)
  },

  async updateTheme(theme) {
    const normalized = normalizeTheme(theme)
    await this.updateSetting('store_theme', normalized)
    return normalized
  }
}

function normalizeColorVariants(data) {
  if (Array.isArray(data.colorVariants) && data.colorVariants.length) {
    return data.colorVariants.map(color => ({
      name: color.name,
      hex: color.hex,
      images: (color.images || []).filter(Boolean),
      sizes: (color.sizes || []).filter(item => item?.size).map(item => ({
        size: item.size,
        stock: Number(item.stock || 0)
      }))
    })).filter(color => color.name && color.hex)
  }
  const images = (data.images || []).map(image => (typeof image === 'string' ? image : image?.url)).filter(Boolean)
  const colors = (data.colors || []).filter(color => color?.name && color?.hex)
  const sizes = (data.sizes || []).filter(size => size?.size).map(size => ({
    size: size.size,
    stock: Number(size.stock || 0)
  }))
  if (!colors.length) return []
  return colors.map(color => ({
    name: color.name,
    hex: color.hex,
    images: [images[Number(color.imageIndex || 0)] || images[0]].filter(Boolean),
    sizes: sizes.length ? sizes : [{ size: 'One Size', stock: Number(data.stock || 0) }]
  }))
}

function normalizeGroceryVariants(data) {
  const variants = Array.isArray(data.variants) ? data.variants : []
  const normalized = variants.map(item => {
    const quantityLabel = String(item.quantityLabel || item.quantity || '').trim()
    const match = quantityLabel.match(/^(\d+(?:\.\d+)?)\s*(.+)$/)
    const isFreeSize = /^free\s*size$/i.test(quantityLabel)
    return {
    quantity: Number(match?.[1] || (isFreeSize ? 1 : item.quantity)),
    unit: String(match?.[2] || item.unit || (isFreeSize ? 'piece' : '')).trim(),
    mrp: Number(item.mrp),
    sellingPrice: Number(item.sellingPrice),
    stock: Number(item.stock),
    colorName: String(item.colorName || 'Option').trim(),
    colorHex: String(item.colorHex || '#111111').trim()
  }})
  if (!normalized.length) throw Object.assign(new Error('Add at least one quantity variant with MRP, selling price and stock'), { statusCode: 400 })
  if (normalized.some(item => !Number.isFinite(item.quantity) || item.quantity <= 0 || !item.unit || !Number.isFinite(item.mrp) || !Number.isFinite(item.sellingPrice) || item.mrp < item.sellingPrice || item.sellingPrice < 0 || !Number.isInteger(item.stock) || item.stock < 0)) {
    throw Object.assign(new Error('Each variant must have a positive quantity, unit, MRP, selling price not above MRP, and a whole-number stock value.'), { statusCode: 400 })
  }
  return normalized
}

async function syncSubcategories(client, categoryId, subcategories = []) {
  const normalized = subcategories
    .map((item, index) => ({
      id: item.id || null,
      name: String(item.name || item.slug || '').trim(),
      slug: String(item.slug || slugify(item.name || '')).trim(),
      sortOrder: Number(item.sortOrder ?? index)
    }))
    .filter(item => item.name && item.slug)
  await client.query(
    `UPDATE category_subcategories SET deleted_at=now(), is_active=false, status='deleted', updated_at=now()
     WHERE category_id=$1 AND deleted_at IS NULL AND NOT (slug = ANY($2::text[]))`,
    [categoryId, normalized.map(item => item.slug)]
  )
  for (const item of normalized) {
    await client.query(
      `INSERT INTO category_subcategories(category_id, name, slug, sort_order)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (category_id, slug) DO UPDATE SET name=$2, sort_order=$4, deleted_at=NULL, is_active=true, status='active', updated_at=now()`,
      [categoryId, item.name, item.slug, item.sortOrder]
    )
  }
}

async function getCategoryDeleteImpact(client, categoryId) {
  const categoryResult = await client.query(
    `SELECT id, name, slug
     FROM categories
     WHERE id=$1 AND deleted_at IS NULL`,
    [categoryId]
  )
  const category = categoryResult.rows[0] || null
  if (!category) return { category: null, totalProducts: 0, subcategories: [] }

  const totalResult = await client.query(
    `SELECT count(*)::int AS count
     FROM products
     WHERE category_id=$1 AND deleted_at IS NULL`,
    [categoryId]
  )
  const subcategoryResult = await client.query(
    `WITH product_subcategories AS (
       SELECT COALESCE(NULLIF(p.subcategory, ''), 'uncategorized') AS subcategory_slug,
         count(p.id)::int AS product_count
       FROM products p
       WHERE p.category_id=$1 AND p.deleted_at IS NULL
       GROUP BY COALESCE(NULLIF(p.subcategory, ''), 'uncategorized')
     )
     SELECT ps.subcategory_slug AS slug,
       COALESCE(s.name, initcap(replace(ps.subcategory_slug, '-', ' '))) AS name,
       ps.product_count AS "productCount"
     FROM product_subcategories ps
     LEFT JOIN category_subcategories s ON s.category_id=$1 AND s.slug=ps.subcategory_slug AND s.deleted_at IS NULL
     ORDER BY name`,
    [categoryId]
  )
  return {
    category,
    totalProducts: totalResult.rows[0]?.count || 0,
    subcategories: subcategoryResult.rows
  }
}

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function titleize(value) {
  return String(value || '').split('-').filter(Boolean).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'General'
}

function buildColorVariants(product) {
  const variants = product.variants || []
  const colorImages = product.colorImages || []
  if (variants.length || colorImages.length) {
    const colorMap = new Map()
    variants.forEach(variant => {
      const key = `${variant.colorName}::${variant.colorHex}`
      if (!colorMap.has(key)) {
        colorMap.set(key, {
          name: variant.colorName,
          hex: variant.colorHex,
          images: colorImages.filter(img => img.colorName === variant.colorName && img.colorHex === variant.colorHex).map(img => img.imageUrl),
          sizes: []
        })
      }
      const entry = colorMap.get(key)
      const existing = entry.sizes.find(size => size.size === variant.size)
      if (existing) existing.stock = Number(variant.stock || 0)
      else entry.sizes.push({ size: variant.size, stock: Number(variant.stock || 0) })
    })
    colorImages.forEach(img => {
      const key = `${img.colorName}::${img.colorHex}`
      if (!colorMap.has(key)) {
        colorMap.set(key, { name: img.colorName, hex: img.colorHex, images: [], sizes: [] })
      }
      const entry = colorMap.get(key)
      if (!entry.images.includes(img.imageUrl)) entry.images.push(img.imageUrl)
    })
    return [...colorMap.values()]
  }
  const images = (product.images || []).map(image => image.url || image).filter(Boolean)
  const colors = product.colors || []
  const sizes = product.sizes || []
  if (!colors.length) return []
  return colors.map(color => ({
    name: color.name,
    hex: color.hex,
    images: [images[Number(color.imageIndex || 0)] || images[0]].filter(Boolean),
    sizes: sizes.map(size => ({ size: size.size, stock: Number(size.stock || 0) }))
  }))
}

function resolveOrderDateRange(filters = {}) {
  const now = new Date()
  if (filters.month) {
    const [year, month] = String(filters.month).split('-').map(Number)
    if (year && month) {
      const fromDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
      const toDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
      return { fromDate, toDate }
    }
  }
  const days = Number(filters.days)
  if (days > 0) {
    const fromDate = new Date(now)
    fromDate.setDate(fromDate.getDate() - days)
    fromDate.setHours(0, 0, 0, 0)
    return { fromDate, toDate: null }
  }
  return { fromDate: null, toDate: null }
}
