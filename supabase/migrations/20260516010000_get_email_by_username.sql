-- Migration: Add get_email_by_username function for username-based login
-- Uses SECURITY DEFINER to access auth.users (not accessible from client)

create or replace function public.get_email_by_username(p_username text)
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select au.email
  from auth.users au
  join public.profiles p on p.id = au.id
  where p.username = p_username
$$;

alter function public.get_email_by_username(text) owner to postgres;

grant all on function public.get_email_by_username(text) to anon;
grant all on function public.get_email_by_username(text) to authenticated;
grant all on function public.get_email_by_username(text) to service_role;
