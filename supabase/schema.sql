-- Create categories table
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tools table
create table tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  short_description text,
  long_description text,
  website_url text,
  pricing_type text check (pricing_type in ('Free', 'Freemium', 'Paid', 'Trial')),
  category_id uuid references categories(id) on delete set null,
  is_published boolean default false,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table categories enable row level security;
alter table tools enable row level security;

-- Create policies (Public read, Admin all)
create policy "Public categories are viewable by everyone" on categories
  for select using (true);

create policy "Public tools are viewable by everyone" on tools
  for select using (is_published = true);

-- Admin policies (TODO: Refine with proper auth role checks later)
create policy "Authenticated users can insert tools" on tools
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update tools" on tools
  for update using (auth.role() = 'authenticated');
  
create policy "Authenticated users can delete tools" on tools
  for delete using (auth.role() = 'authenticated');
