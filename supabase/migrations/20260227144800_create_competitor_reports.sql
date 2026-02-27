-- Migration for competitor_reports table

CREATE TABLE IF NOT EXISTS competitor_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode TEXT NOT NULL CHECK (mode IN ('custom', 'library')),
    params JSONB NOT NULL,
    report JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: We might want RLS policies if this app uses Supabase Auth, but based on existing 
-- migrations (like 20260114000200_create_review_qa_history.sql) we just create the table.
-- Let's just create it as the other tables don't have RLS explicitly defined in their init scripts unless needed.
