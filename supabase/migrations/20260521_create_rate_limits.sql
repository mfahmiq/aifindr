-- Create rate limits tracking table
create table if not exists rate_limits (
  ip text primary key,
  request_count integer not null default 0,
  reset_time timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table rate_limits enable row level security;

-- Create policy for admin/service role access
create policy "Admin full access on rate_limits" on rate_limits
  for all using (true);
