create table if not exists ad_settings (
    placement text primary key,
    max_slots integer not null default 0,
    price_per_period integer not null default 0,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Insert default values
insert into ad_settings (placement, max_slots, price_per_period)
values 
    ('sidebar', 5, 150000),
    ('navbar', 2, 350000),
    ('banner', 1, 750000)
on conflict (placement) do nothing;

alter table ad_settings enable row level security;
create policy "Public read access" on ad_settings for select using (true);
create policy "Admin update access" on ad_settings for update using (true); -- In prod restrict to admin role
