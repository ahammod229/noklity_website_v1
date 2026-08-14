-- Restore admin RLS access after manual Supabase policy/function changes.
-- This fixes errors such as "permission denied for function is_admin".

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and coalesce(p.status, 'active') = 'active'
  );
$$;

grant execute on function public.is_admin() to anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

insert into public.profiles (id, email, full_name, role, status)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', 'Admin'),
  'admin',
  'active'
from auth.users u
where lower(u.email) in ('noklitybd@gmail.com')
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name, 'Admin'),
  role = 'admin',
  status = 'active';

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

