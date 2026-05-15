-- ── Per-user notification read state ─────────────────────────
-- Previously, notifications were inserted without a profile_id
-- (broadcast to all staff/admin). Now each staff/admin gets their
-- own row so read state is independent per user.

-- ── Update trigger: new order → one row per staff/admin ──────
create or replace function public.handle_new_order_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (profile_id, type, title, message, data)
  select
    p.id,
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
  from public.profiles p
  where p.role in ('admin', 'staff');

  return new;
end;
$$;

-- ── Update trigger: order ready → one row per staff/admin ────
create or replace function public.handle_order_status_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'ready' and (old.status is distinct from 'ready') then
    insert into public.notifications (profile_id, type, title, message, data)
    select
      p.id,
      'order_ready',
      'Order Ready for Pickup',
      'Order #' || upper(substring(new.id::text, 1, 8)) ||
        ' for ' || new.customer_name || ' is ready!',
      jsonb_build_object(
        'order_id', new.id,
        'customer_name', new.customer_name
      )
    from public.profiles p
    where p.role in ('admin', 'staff');
  end if;
  return new;
end;
$$;

-- ── Clean up legacy broadcast notifications ─────────────────
delete from public.notifications where profile_id is null;

-- ── Drop old policies, create per-user policies ─────────────
drop policy if exists "Staff can view notifications" on public.notifications;
drop policy if exists "Staff can update notifications" on public.notifications;

create policy "Users can view own notifications"
  on public.notifications for select
  using (profile_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update
  using (profile_id = auth.uid());
