-- Comprehensive Schema Update

-- 1. Competitors: Add Analysis Fields
ALTER TABLE competitors 
ADD COLUMN IF NOT EXISTS brand_characteristic_analysis jsonb,
ADD COLUMN IF NOT EXISTS qa_analysis jsonb;

-- 2. Products: Add Price Analysis
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price_analysis jsonb;

-- 3. Comparison History: Add Searchable Fields (Redundant but useful for filtering)
ALTER TABLE comparison_history
ADD COLUMN IF NOT EXISTS product_ids text[], -- Array of product IDs
ADD COLUMN IF NOT EXISTS product_names text[]; -- Array of product names

-- 4. Favorites: Ensure created_at is correct (already exists, data migration handles mapping)
-- Note: Favorites table schema is fine (id, product_id, created_at).
