-- Run: psql "$DATABASE_URL" -f db/migrations/001_product_variants.sql

CREATE TABLE IF NOT EXISTS product_color_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_name text NOT NULL,
  color_hex text NOT NULL,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_name text NOT NULL,
  color_hex text NOT NULL,
  size text NOT NULL,
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(product_id, color_name, size)
);

DROP TRIGGER IF EXISTS trg_product_color_images_updated_at ON product_color_images;
CREATE TRIGGER trg_product_color_images_updated_at BEFORE UPDATE ON product_color_images FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON product_variants;
CREATE TRIGGER trg_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
