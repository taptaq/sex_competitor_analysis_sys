-- Add missing fields to products table
-- User reported missing 'analysis' (for QA/pain points) and 'priceHistory' (price_history)

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS analysis jsonb, -- General analysis / User QA & Pain Points
ADD COLUMN IF NOT EXISTS price_history jsonb, -- Historical price data
ADD COLUMN IF NOT EXISTS launch_date text; -- Product launch date
