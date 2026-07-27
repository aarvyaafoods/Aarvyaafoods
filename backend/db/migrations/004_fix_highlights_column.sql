-- Add highlights column to products if it doesn't exist
-- This migration ensures the column exists for admin features to work properly

ALTER TABLE products
ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'highlights';
