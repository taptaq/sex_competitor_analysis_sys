-- Create table for storing Standardization Lab / Product Lie Detector tests
create table if not exists standardization_tests (
  id uuid default gen_random_uuid() primary key,
  product_name text not null,
  product_id uuid references products(id) on delete set null,
  competitor_id uuid references competitors(id) on delete set null,
  
  -- Input snapshot
  description text,
  parameters jsonb,
  reviews_sample text, -- truncated or full? text is fine for postgres
  
  -- Analysis Result
  result_data jsonb not null,
  
  created_at timestamptz default now()
);

-- Add RLS policies (optional but good practice)
alter table standardization_tests enable row level security;

create policy "Allow public read access"
  on standardization_tests for select
  using (true);

create policy "Allow public insert access"
  on standardization_tests for insert
  with check (true);
