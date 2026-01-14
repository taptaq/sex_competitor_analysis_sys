create table if not exists review_qa_history (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  result jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table review_qa_history enable row level security;

-- Create policy for public access (adjust if you have auth)
create policy "Allow public access" on review_qa_history
  for all using (true) with check (true);
