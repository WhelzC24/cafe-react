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