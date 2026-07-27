CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  google_id text UNIQUE,
  phone text,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(email,'')));
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status, is_active);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label text NOT NULL,
  full_name text NOT NULL,
  phone text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text,
  pincode text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_order_updates boolean NOT NULL DEFAULT true,
  promo_offers boolean NOT NULL DEFAULT false,
  whatsapp boolean NOT NULL DEFAULT true,
  sms boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

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

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
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

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id),
  brand_id uuid NOT NULL REFERENCES brands(id),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  subcategory text NOT NULL,
  sell_price numeric(12,2) NOT NULL CHECK (sell_price >= 0),
  mrp numeric(12,2) NOT NULL CHECK (mrp >= sell_price),
  discount_percent int NOT NULL DEFAULT 0,
  tag text,
  offer_tag text,
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  material text,
  highlights jsonb NOT NULL DEFAULT '{}'::jsonb,
  care text,
  ingredients text,
  storage_instructions text,
  shelf_life text,
  fssai_license_number text,
  veg_non_veg text,
  organic boolean,
  best_before text,
  allergen_information text,
  spice_level text,
  sweetness_level text,
  shipping_details text,
  description text,
  is_featured boolean NOT NULL DEFAULT false,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  reviews int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_products_filters ON products(category_id, brand_id, subcategory, tag, sell_price, status);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(subcategory,'')));

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS product_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  hex text NOT NULL,
  image_index int DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS product_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size text NOT NULL,
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  quantity numeric(12,3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit text NOT NULL DEFAULT 'unit',
  mrp numeric(12,2) NOT NULL DEFAULT 0 CHECK (mrp >= selling_price),
  selling_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(product_id, size)
);

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

CREATE TABLE IF NOT EXISTS hero_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kicker text,
  title text NOT NULL,
  subtitle text,
  cta_label text,
  cta_link text,
  image_url text NOT NULL,
  video_url text,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage','fixed','shipping')),
  value numeric(12,2) NOT NULL DEFAULT 0,
  min_cart numeric(12,2) NOT NULL DEFAULT 0,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size text NOT NULL,
  color text NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(cart_id, product_id, size, color)
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  order_number text UNIQUE NOT NULL,
  address_id uuid REFERENCES user_addresses(id) ON DELETE SET NULL,
  shipping_address jsonb,
  subtotal numeric(12,2) NOT NULL,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  shipping_amount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL,
  promo_code text,
  payment_method text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  tracking_url text,
  status text NOT NULL DEFAULT 'pending',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  brand_name text,
  size text NOT NULL,
  color text NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL,
  total_price numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  provider text NOT NULL,
  provider_order_id text,
  provider_payment_id text,
  provider_signature text,
  amount int NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  failure_reason text,
  paid_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  type text NOT NULL,
  status text NOT NULL,
  amount int NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  url text NOT NULL,
  object_key text NOT NULL,
  file_name text,
  mime_type text,
  size_bytes int,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  read_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  source text DEFAULT 'footer',
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS stock_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email text NOT NULL,
  size text,
  color text,
  notified_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['roles','permissions','role_permissions','users','refresh_tokens','password_reset_tokens','user_addresses','user_notification_preferences','categories','category_subcategories','brands','catalog_colors','catalog_sizes','products','product_images','product_colors','product_sizes','product_color_images','product_variants','hero_banners','site_settings','promo_codes','carts','cart_items','orders','order_items','payments','transactions','uploads','notifications','newsletter_subscriptions','stock_notifications']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;
