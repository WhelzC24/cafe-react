-- Create RPC function to update product images (bypasses RLS)
create or replace function public.update_product_image(
  p_product_name text,
  p_image_url text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set image_url = p_image_url
  where name = p_product_name;
  
  return true;
end;
$$;

grant execute on function public.update_product_image(text, text) to anon, authenticated, service_role;
