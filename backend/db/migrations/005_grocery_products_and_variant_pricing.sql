-- Converts catalog data used by the application to grocery-specific metadata
-- and makes each purchasable variant independently priced.

DELETE FROM users WHERE email = 'admin@gmail.com';

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS ingredients text,
  ADD COLUMN IF NOT EXISTS storage_instructions text,
  ADD COLUMN IF NOT EXISTS shelf_life text,
  ADD COLUMN IF NOT EXISTS fssai_license_number text,
  ADD COLUMN IF NOT EXISTS veg_non_veg text,
  ADD COLUMN IF NOT EXISTS organic boolean,
  ADD COLUMN IF NOT EXISTS best_before text,
  ADD COLUMN IF NOT EXISTS allergen_information text,
  ADD COLUMN IF NOT EXISTS spice_level text,
  ADD COLUMN IF NOT EXISTS sweetness_level text;

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS quantity numeric(12,3),
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS mrp numeric(12,2),
  ADD COLUMN IF NOT EXISTS selling_price numeric(12,2);

UPDATE product_variants pv
SET quantity = COALESCE(pv.quantity, 1),
    unit = COALESCE(NULLIF(pv.unit, ''), 'unit'),
    mrp = COALESCE(pv.mrp, p.mrp, 0),
    selling_price = COALESCE(pv.selling_price, p.sell_price, 0)
FROM products p
WHERE p.id = pv.product_id
  AND (pv.quantity IS NULL OR pv.unit IS NULL OR pv.mrp IS NULL OR pv.selling_price IS NULL);

ALTER TABLE product_variants
  ALTER COLUMN quantity SET NOT NULL,
  ALTER COLUMN unit SET NOT NULL,
  ALTER COLUMN mrp SET NOT NULL,
  ALTER COLUMN selling_price SET NOT NULL;

ALTER TABLE product_variants
  ADD CONSTRAINT product_variants_quantity_positive CHECK (quantity > 0),
  ADD CONSTRAINT product_variants_price_valid CHECK (mrp >= selling_price AND selling_price >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_product_quantity_unit
  ON product_variants(product_id, quantity, unit)
  WHERE deleted_at IS NULL;
