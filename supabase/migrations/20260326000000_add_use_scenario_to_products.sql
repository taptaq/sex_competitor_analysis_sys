-- Add use_scenario column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS use_scenario TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS persona_analysis TEXT;

-- Add comments to the columns for clarity
COMMENT ON COLUMN products.use_scenario IS 'AI-generated vertical usage scenario for the product';
COMMENT ON COLUMN products.persona_analysis IS 'AI-generated target user persona analysis for the product';
