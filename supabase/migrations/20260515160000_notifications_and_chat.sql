
-- ── NOTIFICATIONS TABLE ──────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default extensions.uuid_generate_v4(),
  profile_id uuid references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  message    text not null,
  data       jsonb default '{}'::jsonb,
  is_read    boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications owner to postgres;
alter table public.notifications enable row level security;

-- ── NOTIFICATION TRIGGER: new order ───────────────────
create or replace function public.handle_new_order_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (type, title, message, data)
  values (
    'new_order',
    'New Order Received',
    'Order #' || upper(substring(new.id::text, 1, 8)) ||
    ' — ' || format('₱%s', round(new.total_amount::numeric, 2)) ||
    ' from ' || new.customer_name,
    jsonb_build_object(
      'order_id', new.id,
      'customer_name', new.customer_name,
      'total_amount', new.total_amount
    )
  );
  return new;
end;
$$;

drop trigger if exists on_order_insert_notification on public.orders;
create trigger on_order_insert_notification
  after insert on public.orders
  for each row execute function public.handle_new_order_notification();

-- ── NOTIFICATION TRIGGER: order ready ─────────────────
create or replace function public.handle_order_status_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'ready' and (old.status is distinct from 'ready') then
    insert into public.notifications (type, title, message, data)
    values (
      'order_ready',
      'Order Ready for Pickup',
      'Order #' || upper(substring(new.id::text, 1, 8)) ||
      ' for ' || new.customer_name || ' is ready!',
      jsonb_build_object(
        'order_id', new.id,
        'customer_name', new.customer_name
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_update_notification on public.orders;
create trigger on_order_update_notification
  after update of status on public.orders
  for each row execute function public.handle_order_status_notification();

-- ── CHATBOT: get_order_status ────────────────────────
create or replace function public.get_order_status(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'id', o.id,
    'customer_name', o.customer_name,
    'status', o.status,
    'total_amount', o.total_amount,
    'created_at', o.created_at,
    'notes', o.notes,
    'items', coalesce(
      (select jsonb_agg(
        jsonb_build_object(
          'product_name', oi.product_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'line_total', oi.line_total
        )
        order by oi.product_name
      ) from public.order_items oi where oi.order_id = o.id),
      '[]'::jsonb
    )
  ) into v_result
  from public.orders o
  where o.id = p_order_id;

  return v_result;
end;
$$;

-- ── RLS POLICIES ─────────────────────────────────────
drop policy if exists "Staff can view notifications" on public.notifications;
create policy "Staff can view notifications"
  on public.notifications for select
  using (public.get_my_role() in ('admin', 'staff'));

drop policy if exists "Staff can update notifications" on public.notifications;
create policy "Staff can update notifications"
  on public.notifications for update
  using (public.get_my_role() in ('admin', 'staff'));

-- Only the system (trigger) inserts, so no insert policy for users

-- ── GRANTS ───────────────────────────────────────────
grant usage on schema public to anon, authenticated, service_role;
grant all on table public.notifications to authenticated, service_role;
grant execute on function public.get_order_status(uuid) to anon, authenticated, service_role;

-- Add notifications to realtime publication (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
