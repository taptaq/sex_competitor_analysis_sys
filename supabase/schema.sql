-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Competitors Table
create table competitors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  domain text,
  country text,
  founded_date text,
  description text,
  focus text check (focus in ('Male', 'Female', 'Unisex')),
  philosophy text[], -- Array of strings
  sentiment jsonb, -- {material, noise, privacy, easeOfUse, value}
  is_domestic boolean default true,
  created_at timestamptz default now()
);

-- 2. Products Table
create table products (
  id uuid primary key default uuid_generate_v4(),
  competitor_id uuid references competitors(id) on delete cascade,
  name text not null,
  price numeric,
  category text,
  tags text[],
  link text,
  image text,
  sales numeric,
  launch_date text,
  gender text check (gender in ('Male', 'Female', 'Unisex')),
  specs jsonb, -- {dimensions, material, etc.}
  price_history jsonb, -- Array of {date, price} objects
  analysis jsonb, -- AI Analysis result
  reviews jsonb, -- Local reviews snapshot
  created_at timestamptz default now()
);

-- 3. Comparison History Table
create table comparison_history (
  id uuid primary key default uuid_generate_v4(),
  analysis jsonb not null, -- Full ComparisonAnalysis object
  products jsonb not null, -- Snapshot of products compared
  created_at timestamptz default now()
);

-- 4. Deep Reports Table
create table deep_reports (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  competitor_id uuid references competitors(id) on delete cascade,
  report jsonb not null, -- Full DeepCompetitorReport object
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Favorites Table
create table favorites (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_products_competitor on products(competitor_id);
create index idx_deep_reports_product on deep_reports(product_id);
create index idx_deep_reports_competitor on deep_reports(competitor_id);
create index idx_favorites_product on favorites(product_id);

-- RLS Policies (Open for now, consistent with current dev mode)
alter table competitors enable row level security;
alter table products enable row level security;
alter table comparison_history enable row level security;
alter table deep_reports enable row level security;
alter table favorites enable row level security;

create policy "Public Access" on competitors for all using (true);
create policy "Public Access" on products for all using (true);
create policy "Public Access" on comparison_history for all using (true);
create policy "Public Access" on deep_reports for all using (true);
create policy "Public Access" on favorites for all using (true);
