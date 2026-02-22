-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  username text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  username_val text;
begin
  -- Try to get username from metadata, fallback to email prefix if not present
  username_val := new.raw_user_meta_data->>'username';
  if username_val is null then
    username_val := distinct_username_from_email(new.email);
  end if;

  insert into public.profiles (id, email, username, role)
  values (new.id, new.email, username_val, 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
-- Drop if exists to ensure clean update
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper function to extract username from email if needed (fallback)
create or replace function distinct_username_from_email(email text)
returns text as $$
begin
  return split_part(email, '@', 1);
end;
$$ language plpgsql;
