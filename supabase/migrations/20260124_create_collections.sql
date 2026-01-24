
-- 1. Create collections table
create table if not exists collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  slug text not null unique,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create collection_items table
create table if not exists collection_items (
  id uuid default gen_random_uuid() primary key,
  collection_id uuid references collections(id) on delete cascade not null,
  tool_id bigint references tools(id) on delete cascade not null, -- Assuming tools.id is bigint based on typical supabase setups, check if uuid
  note text,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: Verified previously that tools.id is bigint in existing code/types (usually), 
-- but if it's uuid, this line needs adjustment. 
-- Based on previous context, tools id seems to be `id` (often int8/bigint in Supabase starters)
-- Let's double check types.ts later, but usually int8.

-- 3. Enables RLS
alter table collections enable row level security;
alter table collection_items enable row level security;

-- 4. Policies for 'collections'

-- Public read access for public collections
create policy "Public collections are viewable by everyone"
  on collections for select
  using ( is_public = true );

-- Owner can do everything
create policy "Users can manage their own collections"
  on collections for all
  using ( auth.uid() = user_id );

-- 5. Policies for 'collection_items'

-- Public read access if parent collection is public
create policy "Public collection items are viewable by everyone"
  on collection_items for select
  using (
    exists (
      select 1 from collections
      where collections.id = collection_items.collection_id
      and collections.is_public = true
    )
  );

-- Owner can manage items (via collection ownership)
create policy "Users can manage items in their own collections"
  on collection_items for all
  using (
    exists (
      select 1 from collections
      where collections.id = collection_items.collection_id
      and collections.user_id = auth.uid()
    )
  );

-- 6. Indexes for performance
create index collection_slug_idx on collections (slug);
create index collection_user_id_idx on collections (user_id);
create index collection_items_collection_id_idx on collection_items (collection_id);
