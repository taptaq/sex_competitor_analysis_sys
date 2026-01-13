-- Create table for Thinking Wall Data
create table if not exists thinking_notes (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  color text default 'yellow', -- yellow, pink, blue, green, purple
  position_index integer default 0, -- for simple ordering if needed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table thinking_notes enable row level security;

-- Create policies
create policy "Allow public read access"
  on thinking_notes for select
  using (true);

create policy "Allow public insert access"
  on thinking_notes for insert
  with check (true);

create policy "Allow public update access"
  on thinking_notes for update
  using (true);

create policy "Allow public delete access"
  on thinking_notes for delete
  using (true);
