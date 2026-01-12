-- Create table for Medical / Professional Vocabulary
create table if not exists medical_terminology (
  id uuid default gen_random_uuid() primary key,
  term text not null,        -- The common/colloquial term (e.g. "震动")
  replacement text not null, -- The professional replacement (e.g. "触觉共振")
  category text,             -- Optional category (e.g. "Sensory", "Safety", "Material")
  created_at timestamptz default now()
);

-- Add RLS policies
alter table medical_terminology enable row level security;

create policy "Allow public read access"
  on medical_terminology for select
  using (true);

create policy "Allow public insert access"
  on medical_terminology for insert
  with check (true);

create policy "Allow public update access"
  on medical_terminology for update
  using (true);

create policy "Allow public delete access"
  on medical_terminology for delete
  using (true);
