create table if not exists product_reviews (
  id uuid default gen_random_uuid() primary key,
  product_name text not null,
  content text not null,
  sentiment text,
  batch_id text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table product_reviews enable row level security;

-- Create policy to allow full access (for this internal tool)
create policy "Allow full access to product_reviews"
  on product_reviews for all
  using (true)
  with check (true);
