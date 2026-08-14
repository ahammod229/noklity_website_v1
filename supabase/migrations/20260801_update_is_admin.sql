-- =====================================================================
-- Update `is_admin()` to work with Firebase Auth (via x-firebase-uid header)
-- Since we are bypassing Supabase Auth, `auth.uid()` evaluates to null.
-- We inject the Firebase UID in the request headers on the frontend.
-- =====================================================================

create or replace function public.get_firebase_uid()
returns text
language sql
stable
as $$
  select current_setting('request.headers', true)::json->>'x-firebase-uid';
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.uid = public.get_firebase_uid()
      and u.role = 'admin'
      and coalesce(u.status, 'active') = 'active'
  );
$$;

grant execute on function public.get_firebase_uid() to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;
