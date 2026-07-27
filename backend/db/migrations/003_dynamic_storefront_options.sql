-- Run: psql "$DATABASE_URL" -f db/migrations/003_dynamic_storefront_options.sql

CREATE TABLE IF NOT EXISTS category_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(category_id, slug)
);

CREATE TABLE IF NOT EXISTS catalog_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hex text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(name, hex)
);

CREATE TABLE IF NOT EXISTS catalog_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  size text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

INSERT INTO category_subcategories(category_id, name, slug, sort_order)
SELECT c.id, initcap(replace(p.subcategory, '-', ' ')), p.subcategory, row_number() OVER (PARTITION BY c.id ORDER BY p.subcategory)
FROM (
  SELECT DISTINCT category_id, subcategory
  FROM products
  WHERE deleted_at IS NULL AND coalesce(subcategory, '') <> ''
) p
JOIN categories c ON c.id=p.category_id
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO catalog_colors(name, hex, sort_order)
SELECT name, hex, row_number() OVER (ORDER BY lower(name), lower(hex))
FROM (
  SELECT DISTINCT name, hex
  FROM product_colors
  WHERE deleted_at IS NULL AND coalesce(name, '') <> '' AND coalesce(hex, '') <> ''
) colors
ON CONFLICT (name, hex) DO UPDATE SET deleted_at=NULL, is_active=true, status='active', updated_at=now();

INSERT INTO catalog_sizes(size, sort_order)
SELECT size, row_number() OVER (ORDER BY size)
FROM (
  SELECT DISTINCT size
  FROM product_sizes
  WHERE deleted_at IS NULL AND coalesce(size, '') <> ''
) sizes
ON CONFLICT (size) DO UPDATE SET deleted_at=NULL, is_active=true, status='active', updated_at=now();

DROP TRIGGER IF EXISTS trg_category_subcategories_updated_at ON category_subcategories;
CREATE TRIGGER trg_category_subcategories_updated_at BEFORE UPDATE ON category_subcategories FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_catalog_colors_updated_at ON catalog_colors;
CREATE TRIGGER trg_catalog_colors_updated_at BEFORE UPDATE ON catalog_colors FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_catalog_sizes_updated_at ON catalog_sizes;
CREATE TRIGGER trg_catalog_sizes_updated_at BEFORE UPDATE ON catalog_sizes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
