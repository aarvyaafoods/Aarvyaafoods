INSERT INTO roles(name) VALUES ('customer'), ('admin') ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions(name) VALUES ('view_catalog') ON CONFLICT (name) DO NOTHING;
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='customer' AND p.name='view_catalog'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO users(role_id, name, email, phone, password_hash)
SELECT id, 'Aarvya Admin', 'admin@aarvya.com', null, '$2b$12$b55rR7gnTgt40IPlwnQae.CFWf27yj8AEprXupE7cvCjRrA6vGgrq'
FROM roles WHERE name='admin'
ON CONFLICT (email) DO UPDATE SET role_id=EXCLUDED.role_id, password_hash=EXCLUDED.password_hash, is_active=true, status='active', updated_at=now();

INSERT INTO users(role_id, name, email, phone, password_hash)
SELECT id, 'Rahul Sharma', 'rahul@example.com', '+91 98765 43210', '$2b$12$2kzY7kG0HdK6Y5oVxo6pK.VecmiGGFnlCHYr/dSu3zfVJ/a9eCp66'
FROM roles WHERE name='customer'
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_addresses(user_id, label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default)
SELECT id, 'Home', 'Rahul Sharma', '+91 98765 43210', '42, Poes Garden, Alwarpet', 'Near Greenways Road', 'Chennai', 'Tamil Nadu', '600086', true
FROM users WHERE email='rahul@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO user_notification_preferences(user_id)
SELECT id FROM users WHERE email='rahul@example.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO categories(name, slug, image_url, sort_order)
VALUES ('Men', 'men', 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=300&q=80', 1)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO brands(name) VALUES ('Levi''s') ON CONFLICT (name) DO NOTHING;

INSERT INTO products(category_id, brand_id, name, slug, subcategory, sell_price, mrp, discount_percent, tag, offer_tag, stock, material, care, description, is_featured, rating, reviews)
SELECT c.id, b.id, 'Oversized Graphic Tee', 'oversized-graphic-tee', 't-shirts', 1299, 2199, 41, 'SALE', 'BUY 2 @1399', 8,
  '100% Combed Cotton 220 GSM', 'Machine wash cold. Do not bleach.',
  'A relaxed fit graphic tee in premium combed cotton. Bold screen print inspired by urban street culture.', true, 4.4, 128
FROM categories c, brands b WHERE c.slug='men' AND b.name='Levi''s'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_images(product_id, image_url, alt_text, sort_order)
SELECT id, 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80', name, 1 FROM products WHERE slug='oversized-graphic-tee'
ON CONFLICT DO NOTHING;

INSERT INTO product_colors(product_id, name, hex, image_index, sort_order)
SELECT id, 'Black', '#1a1a1a', 0, 1 FROM products WHERE slug='oversized-graphic-tee'
ON CONFLICT DO NOTHING;

INSERT INTO product_sizes(product_id, size, stock, sort_order)
SELECT id, 'M', 8, 1 FROM products WHERE slug='oversized-graphic-tee'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO hero_banners(kicker, title, subtitle, cta_label, cta_link, image_url, sort_order)
VALUES ('Summer Collection 2026', 'FRESH DROPS', 'Discover bold styles made for those who move fast.', 'Shop New Arrivals', '/plp?tag=NEW', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80', 1)
ON CONFLICT DO NOTHING;

INSERT INTO site_settings(key, value)
VALUES ('footer_marquee', '{"message":"Free shipping on orders above Rs. 999"}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_settings(key, value)
VALUES ('announcement_bar', '{"messages":["Free delivery on orders above Rs. 999","Use FIRST10 for 10% off your first order"]}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO promo_codes(code, type, value, min_cart, description)
VALUES ('FIRST10', 'percentage', 10, 0, '10% off your first order')
ON CONFLICT (code) DO NOTHING;

INSERT INTO carts(user_id)
SELECT id FROM users WHERE email='rahul@example.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO cart_items(cart_id, product_id, size, color, quantity)
SELECT ca.id, p.id, 'M', '#1a1a1a', 1 FROM carts ca JOIN users u ON u.id=ca.user_id CROSS JOIN products p
WHERE u.email='rahul@example.com' AND p.slug='oversized-graphic-tee'
ON CONFLICT (cart_id, product_id, size, color) DO NOTHING;

INSERT INTO orders(user_id, order_number, shipping_address, subtotal, discount_amount, shipping_amount, total, payment_method, payment_status, status)
SELECT id, 'ORD-2026-00001', '{"fullName":"Rahul Sharma","city":"Chennai","pincode":"600086"}', 1299, 0, 0, 1299, 'razorpay', 'paid', 'paid'
FROM users WHERE email='rahul@example.com'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO order_items(order_id, product_id, product_name, brand_name, size, color, quantity, unit_price, total_price)
SELECT o.id, p.id, p.name, 'Levi''s', 'M', '#1a1a1a', 1, 1299, 1299 FROM orders o CROSS JOIN products p
WHERE o.order_number='ORD-2026-00001' AND p.slug='oversized-graphic-tee'
ON CONFLICT DO NOTHING;

INSERT INTO payments(order_id, user_id, provider, provider_order_id, provider_payment_id, amount, currency, status, paid_at)
SELECT o.id, o.user_id, 'razorpay', 'order_sample', 'pay_sample', 129900, 'INR', 'success', now()
FROM orders o WHERE o.order_number='ORD-2026-00001'
ON CONFLICT DO NOTHING;

INSERT INTO transactions(payment_id, type, status, amount, payload)
SELECT id, 'capture', 'success', 129900, '{"seed":true}' FROM payments WHERE provider_order_id='order_sample'
ON CONFLICT DO NOTHING;

INSERT INTO uploads(uploaded_by, url, object_key, file_name, mime_type, size_bytes)
SELECT id, 'https://cdn.example.com/uploads/sample.jpg', 'uploads/sample.jpg', 'sample.jpg', 'image/jpeg', 1024
FROM users WHERE email='rahul@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO notifications(user_id, title, body)
SELECT id, 'Welcome to Aarvya', 'Your account is ready.' FROM users WHERE email='rahul@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO stock_notifications(product_id, email, size, color)
SELECT id, 'rahul@example.com', 'M', 'Black' FROM products WHERE slug='oversized-graphic-tee'
ON CONFLICT DO NOTHING;

INSERT INTO categories(name, slug, image_url, sort_order) VALUES
('Women', 'women', 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=300&q=80', 2),
('Dresses', 'dresses', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&q=80', 3),
('Accessories', 'accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80', 4),
('Footwear', 'footwear', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80', 5),
('Activewear', 'activewear', 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=300&q=80', 6),
('Ethnic', 'ethnic', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&q=80', 7),
('Kids', 'kids', 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=300&q=80', 8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO brands(name) VALUES ('Zara'), ('Mango'), ('H&M'), ('Only'), ('Vero Moda'), ('Puma'), ('Lavie')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products(category_id, brand_id, name, slug, subcategory, sell_price, mrp, discount_percent, tag, offer_tag, stock, material, care, description, is_featured, rating, reviews)
SELECT c.id, b.id, p.name, p.slug, p.subcategory, p.sell_price, p.mrp, p.discount_percent, p.tag, p.offer_tag, p.stock, p.material, p.care, p.description, p.is_featured, p.rating, p.reviews
FROM (VALUES
  ('women','Zara','High Waist Wide Leg Jeans','high-waist-wide-leg-jeans','jeans',2499,3999,37,'NEW','BUY 2 @1399',13,'98% Cotton 2% Elastane','Machine wash cold.','High waist wide leg jeans with a flattering relaxed fit.',true,4.6,84),
  ('dresses','Mango','Floral Midi Dress','floral-midi-dress','midi-dresses',3199,5499,41,'NEW',null,15,'100% Viscose','Hand wash cold.','A feminine floral midi dress with wrap-style bodice and flowy skirt.',true,4.3,56),
  ('women','Only','Structured Blazer','structured-blazer','blazers',4499,7999,43,'NEW',null,5,'60% Polyester 40% Viscose','Dry clean only.','Tailored structured blazer with a single-breasted front.',true,4.7,43),
  ('men','Levi''s','Cargo Jogger Pants','cargo-jogger-pants','joggers',1599,2699,40,'NEW',null,20,'100% Cotton French Terry','Machine wash cold.','Relaxed cargo joggers with drawstring waist and utility pockets.',true,4.4,167),
  ('women','Vero Moda','Ribbed Knit Sweater','ribbed-knit-sweater','sweaters',1799,2999,40,null,null,12,'50% Cotton 50% Acrylic','Hand wash cold.','Cosy ribbed knit sweater with relaxed fit and soft yarn.',false,4.5,91),
  ('women','Zara','Wrap Midi Skirt','wrap-midi-skirt','skirts',2199,3499,37,null,null,7,'100% Polyester','Machine wash 30C.','Flowing wrap midi skirt in silky satin with adjustable tie waist.',false,4.2,38),
  ('dresses','H&M','Printed Maxi Dress','printed-maxi-dress','maxi-dresses',2799,4499,37,null,null,9,'100% Viscose','Machine wash 30C.','Flowy printed maxi dress with V-neckline and tiered skirt.',false,4.3,54),
  ('women','Only','Cropped Leather Jacket','cropped-leather-jacket','jackets',5999,9999,40,'NEW',null,6,'Faux leather','Wipe with damp cloth.','Cropped faux leather jacket with zip-front closure.',true,4.8,72),
  ('accessories','Lavie','Quilted Sling Bag','quilted-sling-bag','bags',1299,2299,43,'SALE',null,18,'PU leather','Wipe clean.','Compact quilted sling bag with chain strap and secure flap.',true,4.5,61),
  ('footwear','Puma','Court Classic Sneakers','court-classic-sneakers','sneakers',3499,5999,42,'SALE',null,16,'Synthetic upper','Wipe clean.','Everyday low-top sneakers with cushioned footbed.',true,4.4,102),
  ('activewear','Puma','Training Track Pants','training-track-pants','track-pants',1899,2999,37,null,null,22,'Polyester blend','Machine wash cold.','Tapered track pants for training and travel days.',false,4.2,73),
  ('ethnic','Mango','Embroidered Kurta Set','embroidered-kurta-set','kurta-sets',3299,5299,38,'NEW',null,11,'Cotton blend','Gentle machine wash.','Embroidered kurta set with straight pants and dupatta.',true,4.6,48)
) AS p(category_slug, brand_name, name, slug, subcategory, sell_price, mrp, discount_percent, tag, offer_tag, stock, material, care, description, is_featured, rating, reviews)
JOIN categories c ON c.slug=p.category_slug
JOIN brands b ON b.name=p.brand_name
ON CONFLICT (slug) DO UPDATE SET stock=EXCLUDED.stock, tag=EXCLUDED.tag, is_featured=EXCLUDED.is_featured, updated_at=now();

INSERT INTO product_images(product_id, image_url, alt_text, sort_order)
SELECT p.id, i.url, p.name, i.sort_order
FROM products p
JOIN (VALUES
  ('high-waist-wide-leg-jeans','https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',1),
  ('floral-midi-dress','https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',1),
  ('structured-blazer','https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80',1),
  ('cargo-jogger-pants','https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80',1),
  ('ribbed-knit-sweater','https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&q=80',1),
  ('wrap-midi-skirt','https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&q=80',1),
  ('printed-maxi-dress','https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',1),
  ('cropped-leather-jacket','https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',1),
  ('quilted-sling-bag','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',1),
  ('court-classic-sneakers','https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',1),
  ('training-track-pants','https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&q=80',1),
  ('embroidered-kurta-set','https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80',1)
) AS i(slug, url, sort_order) ON i.slug=p.slug
ON CONFLICT DO NOTHING;

INSERT INTO product_colors(product_id, name, hex, image_index, sort_order)
SELECT p.id, c.name, c.hex, 0, c.sort_order
FROM products p
JOIN (VALUES
  ('high-waist-wide-leg-jeans','Indigo','#1a1a2e',1),('floral-midi-dress','Pink','#f8b4d9',1),('structured-blazer','Black','#1a1a1a',1),
  ('cargo-jogger-pants','Olive','#4a5240',1),('ribbed-knit-sweater','Cream','#f5f0eb',1),('wrap-midi-skirt','Black','#1a1a1a',1),
  ('printed-maxi-dress','Blue','#3b82f6',1),('cropped-leather-jacket','Black','#1a1a1a',1),('quilted-sling-bag','Tan','#8B4513',1),
  ('court-classic-sneakers','White','#ffffff',1),('training-track-pants','Navy','#334155',1),('embroidered-kurta-set','Ivory','#f8f3e7',1)
) AS c(slug, name, hex, sort_order) ON c.slug=p.slug
ON CONFLICT DO NOTHING;

INSERT INTO product_sizes(product_id, size, stock, sort_order)
SELECT p.id, s.size, s.stock, s.sort_order
FROM products p
JOIN (VALUES
  ('high-waist-wide-leg-jeans','S',4,1),('high-waist-wide-leg-jeans','M',5,2),('high-waist-wide-leg-jeans','L',4,3),
  ('floral-midi-dress','S',5,1),('floral-midi-dress','M',5,2),('floral-midi-dress','L',5,3),
  ('structured-blazer','S',2,1),('structured-blazer','M',2,2),('structured-blazer','L',1,3),
  ('cargo-jogger-pants','M',8,1),('cargo-jogger-pants','L',8,2),('cargo-jogger-pants','XL',4,3),
  ('ribbed-knit-sweater','S',4,1),('ribbed-knit-sweater','M',4,2),('ribbed-knit-sweater','L',4,3),
  ('wrap-midi-skirt','S',3,1),('wrap-midi-skirt','M',3,2),('wrap-midi-skirt','L',1,3),
  ('printed-maxi-dress','S',3,1),('printed-maxi-dress','M',3,2),('printed-maxi-dress','L',3,3),
  ('cropped-leather-jacket','S',2,1),('cropped-leather-jacket','M',2,2),('cropped-leather-jacket','L',2,3),
  ('quilted-sling-bag','Free Size',18,1),('court-classic-sneakers','7',5,1),('court-classic-sneakers','8',6,2),('court-classic-sneakers','9',5,3),
  ('training-track-pants','M',8,1),('training-track-pants','L',8,2),('training-track-pants','XL',6,3),
  ('embroidered-kurta-set','S',4,1),('embroidered-kurta-set','M',4,2),('embroidered-kurta-set','L',3,3)
) AS s(slug, size, stock, sort_order) ON s.slug=p.slug
ON CONFLICT (product_id, size) DO UPDATE SET stock=EXCLUDED.stock, updated_at=now();

INSERT INTO hero_banners(kicker, title, subtitle, cta_label, cta_link, image_url, video_url, sort_order)
VALUES
('Video Edit', 'MOVE IN STYLE', 'A motion-led hero demo for campaign drops.', 'Explore Styles', '/plp', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&q=80', 'https://videos.pexels.com/video-files/853889/853889-hd_1920_1080_25fps.mp4', 2),
('Women''s Edit', 'POWER DRESSING', 'Bold silhouettes. Refined details. Fashion that speaks.', 'Shop Women''s', '/plp?category=women', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&q=80', null, 3)
ON CONFLICT DO NOTHING;

INSERT INTO promo_codes(code, type, value, min_cart, description) VALUES
('FREESHIP', 'shipping', 0, 0, 'Free shipping applied!'),
('SAVE500', 'fixed', 500, 2000, '500 off on orders above 2000')
ON CONFLICT (code) DO NOTHING;

INSERT INTO products(category_id, brand_id, name, slug, subcategory, sell_price, mrp, discount_percent, tag, offer_tag, stock, material, care, description, is_featured, rating, reviews)
SELECT c.id, b.id, p.name, p.slug, p.subcategory, p.sell_price, p.mrp, p.discount_percent, p.tag, p.offer_tag, 0, p.material, p.care, p.description, false, p.rating, p.reviews
FROM (VALUES
  ('men','H&M','Slim Fit Chinos','slim-fit-chinos','trousers',999,1799,44,'SALE',null,'98% Cotton 2% Elastane','Machine wash 40C.','Slim fit chinos in soft stretch cotton twill.',4.1,200),
  ('women','Vero Moda','V-Neck Knit Top','v-neck-knit-top','tops',899,1599,43,'SALE',null,'80% Viscose 20% Nylon','Hand wash cold.','Softly structured V-neck knit top with subtle rib texture.',4.0,112)
) AS p(category_slug, brand_name, name, slug, subcategory, sell_price, mrp, discount_percent, tag, offer_tag, material, care, description, rating, reviews)
JOIN categories c ON c.slug=p.category_slug
JOIN brands b ON b.name=p.brand_name
ON CONFLICT (slug) DO UPDATE SET stock=0, tag=EXCLUDED.tag, updated_at=now();

INSERT INTO product_images(product_id, image_url, alt_text, sort_order)
SELECT p.id, i.url, p.name, 1
FROM products p
JOIN (VALUES
  ('slim-fit-chinos','https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80'),
  ('v-neck-knit-top','https://images.unsplash.com/photo-1564859228273-274232fdb516?w=800&q=80')
) AS i(slug, url) ON i.slug=p.slug
ON CONFLICT DO NOTHING;

INSERT INTO product_colors(product_id, name, hex, image_index, sort_order)
SELECT p.id, c.name, c.hex, 0, c.sort_order
FROM products p
JOIN (VALUES
  ('slim-fit-chinos','Khaki','#c4a882',1),('slim-fit-chinos','Navy','#334155',2),('slim-fit-chinos','Black','#1a1a1a',3),
  ('v-neck-knit-top','White','#ffffff',1),('v-neck-knit-top','Yellow','#fde68a',2),('v-neck-knit-top','Blush','#fca5a5',3)
) AS c(slug, name, hex, sort_order) ON c.slug=p.slug
ON CONFLICT DO NOTHING;

INSERT INTO product_sizes(product_id, size, stock, sort_order)
SELECT p.id, s.size, 0, s.sort_order
FROM products p
JOIN (VALUES
  ('slim-fit-chinos','28',1),('slim-fit-chinos','30',2),('slim-fit-chinos','32',3),('slim-fit-chinos','34',4),
  ('v-neck-knit-top','XS',1),('v-neck-knit-top','S',2),('v-neck-knit-top','M',3),('v-neck-knit-top','L',4)
) AS s(slug, size, sort_order) ON s.slug=p.slug
ON CONFLICT (product_id, size) DO UPDATE SET stock=0, updated_at=now();

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
