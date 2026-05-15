-- ============================================================
-- Cozy Corner Café — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL editor to set up the database.
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles (extends Supabase auth.users) ───────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  fullname    text        not null,
  username    text        not null unique,
  role        text        not null default 'staff' check (role in ('admin', 'staff')),
  must_change_password boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Policies: users can read their own profile; admins can read all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    public.get_my_role() = 'admin'
  );

create policy "Admins can update profiles"
  on public.profiles for update
  using (
    public.get_my_role() = 'admin'
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (
    public.get_my_role() = 'admin'
  );

create policy "Admins can delete non-admin profiles"
  on public.profiles for delete
  using (
    public.get_my_role() = 'admin'
    and role <> 'admin'
  );

-- ── Products ─────────────────────────────────────────────────
create table if not exists public.products (
  id           uuid primary key default uuid_generate_v4(),
  name         text           not null,
  category     text           not null,
  description  text           not null default '',
  price        numeric(10,2)  not null,
  image_url    text,
  is_available boolean        not null default true,
  created_at   timestamptz    not null default now()
);

alter table public.products enable row level security;

-- Anyone can view available products (public menu)
create policy "Anyone can view available products"
  on public.products for select
  using (is_available = true);

-- Staff/admin can view all products (including unavailable)
create policy "Staff can view all products"
  on public.products for select
  using (
    public.get_my_role() in ('admin', 'staff')
  );

create policy "Staff can manage products"
  on public.products for all
  using (
    public.get_my_role() in ('admin', 'staff')
  );

-- ── Orders ───────────────────────────────────────────────────
create table if not exists public.orders (
  id              uuid primary key default uuid_generate_v4(),
  customer_name   text          not null,
  customer_email  text,
  customer_phone  text          not null,
  notes           text,
  total_amount    numeric(10,2) not null,
  status          text          not null default 'pending'
                    check (status in ('pending','preparing','ready','completed','cancelled')),
  processed_by    uuid references public.profiles(id) on delete set null,
  created_at      timestamptz   not null default now()
);

alter table public.orders enable row level security;

-- Anyone can insert an order (public ordering)
create policy "Anyone can place orders"
  on public.orders for insert
  with check (true);

-- Staff/admin can view and manage orders
create policy "Staff can view all orders"
  on public.orders for select
  using (
    public.get_my_role() in ('admin', 'staff')
  );

create policy "Staff can update orders"
  on public.orders for update
  using (
    public.get_my_role() in ('admin', 'staff')
  );

-- ── Order Items ──────────────────────────────────────────────
create table if not exists public.order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text          not null,
  quantity     int           not null,
  unit_price   numeric(10,2) not null,
  line_total   numeric(10,2) not null
);

alter table public.order_items enable row level security;

create policy "Anyone can insert order items"
  on public.order_items for insert
  with check (true);

create policy "Staff can view order items"
  on public.order_items for select
  using (
    public.get_my_role() in ('admin', 'staff')
  );

-- ── Public order placement helper ───────────────────────────
create or replace function public.place_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_notes text,
  p_total_amount numeric,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  insert into public.orders (
    customer_name,
    customer_email,
    customer_phone,
    notes,
    total_amount,
    status
  )
  values (
    p_customer_name,
    nullif(p_customer_email, ''),
    p_customer_phone,
    nullif(p_notes, ''),
    p_total_amount,
    'pending'
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    quantity,
    unit_price,
    line_total
  )
  select
    v_order_id,
    (item->>'productId')::uuid,
    item->>'productName',
    (item->>'quantity')::int,
    (item->>'unitPrice')::numeric,
    (item->>'lineTotal')::numeric
  from jsonb_array_elements(p_items) as item;

  return v_order_id;
end;
$$;

grant execute on function public.place_order(text, text, text, text, numeric, jsonb) to anon, authenticated, service_role;

-- ── Seed Products ────────────────────────────────────────────
insert into public.products (name, category, description, price, image_url) values
('Espresso',        'Coffee',      'Rich and bold single shot of espresso with a velvety crema on top', 2.50, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&q=80'),
('Americano',       'Coffee',      'Espresso with hot water for a smooth, full-bodied taste', 3.00, 'https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=600&q=80'),
('Cappuccino',      'Coffee',      'Espresso with steamed milk and a thick layer of velvety foam', 4.00, 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&q=80'),
('Latte',           'Coffee',      'Creamy espresso drink with silky steamed milk and light foam art', 4.50, 'https://images.unsplash.com/photo-1540779549336-2c938e7a8038?w=600&q=80'),
('Flat White',      'Coffee',      'Velvety microfoam milk with a double ristretto espresso base', 4.75, 'https://images.unsplash.com/photo-1634432744886-e0e09b49e24c?w=600&q=80'),
('Croissant',       'Pastries',    'Buttery, flaky French pastry baked fresh every morning', 3.50, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80'),
('Chocolate Donut', 'Pastries',    'Soft, pillowy donut dipped in rich chocolate glaze', 2.75, 'https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=600&q=80'),
('Blueberry Muffin','Pastries',    'Moist muffin loaded with fresh blueberries and a crumbly sugar top', 3.25, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80'),
('Cinnamon Roll',   'Pastries',    'Warm cinnamon roll with brown sugar filling and cream cheese frosting', 4.00, 'https://images.unsplash.com/photo-1609771776991-49355b2a6885?w=600&q=80'),
('Cheesecake Slice','Pastries',    'Creamy New York-style cheesecake with a buttery graham cracker crust', 5.50, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80'),
('Iced Coffee',     'Cold Drinks', 'Chilled cold-brew coffee poured over ice with your choice of milk', 3.50, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80'),
('Matcha Latte',    'Cold Drinks', 'Premium ceremonial-grade matcha whisked with oat milk over ice', 5.00, 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600&q=80'),
('Fresh Orange Juice','Cold Drinks','Freshly squeezed oranges for a bright, vitamin-packed morning boost', 4.50, 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=80'),
('Hot Chocolate',   'Hot Drinks',  'Belgian dark chocolate melted into steamed milk, topped with whipped cream', 3.75, 'https://images.unsplash.com/photo-1542990253-a781e04c0082?w=600&q=80'),
('Avocado Toast',   'Food',        'Smashed avocado on sourdough with cherry tomatoes, chili flakes and sea salt', 7.50, 'https://images.unsplash.com/photo-1628556820645-63ba5f90e6a2?w=600&q=80'),
('Club Sandwich',   'Food',        'Triple-decker with grilled chicken, bacon, lettuce, tomato and mayo on toasted bread', 9.00, 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=600&q=80');

-- ── Helper function: get current user role ───────────────────
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ── Realtime ─────────────────────────────────────────────────
-- Enable realtime for orders so the dashboard updates live
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
