-- Add standardization_analysis column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS standardization_analysis JSONB;

-- Add comment for clarity
COMMENT ON COLUMN products.standardization_analysis IS 'AI-generated standardization and sensory quantification analysis';
