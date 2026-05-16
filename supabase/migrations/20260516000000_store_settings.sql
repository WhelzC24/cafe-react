-- Store settings table
create table if not exists public.store_settings (
  id bigint primary key default 1,
  store_name text not null default 'Cozy Corner Café',
  weekday_hours text not null default '7:00 AM – 8:00 PM',
  weekend_hours text not null default '8:00 AM – 9:00 PM',
  address text not null default 'Cuasi, Loon, Bohol, Philippines',
  phone text not null default '09361679546',
  email text not null default 'wlaniba330@gmail.com',
  about_text text not null default 'Nestled in the heart of Loon, Bohol, Cozy Corner Café was born from a simple belief: that a great cup of coffee can transform a moment.',
  updated_at timestamptz default now() not null,
  constraint one_row check (id = 1)
);

alter table public.store_settings enable row level security;

-- Only admins can read/write settings
create policy "Admins can manage store settings"
  on public.store_settings
  using ((select public.get_my_role()) = 'admin');

-- Insert default row
insert into public.store_settings (id) values (1)
on conflict (id) do nothing;
