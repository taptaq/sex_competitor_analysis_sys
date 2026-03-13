CREATE TABLE IF NOT EXISTS public.brand_characteristics_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.brand_characteristics_history ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to select, insert, delete
CREATE POLICY "Enable read access for all users" ON public.brand_characteristics_history
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.brand_characteristics_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON public.brand_characteristics_history
    FOR DELETE USING (true);

-- Create index for faster queries by competitor
CREATE INDEX idx_brand_characteristics_history_competitor_id ON public.brand_characteristics_history(competitor_id);
