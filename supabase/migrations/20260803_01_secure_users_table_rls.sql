-- =====================================================================
-- Re-enable RLS on the users table and establish secure policies
-- =====================================================================

-- 1. Enable RLS
alter table public.users enable row level security;

-- 2. Drop existing policies (if any somehow exist)
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Admins can view all profiles" on public.users;
drop policy if exists "Users can insert own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Admins can manage all users" on public.users;

-- 3. Create policies
-- A user can view their own profile
create policy "Users can view own profile"
on public.users for select
using (uid = public.get_firebase_uid());

-- An admin can view all profiles
create policy "Admins can view all profiles"
on public.users for select
using (public.is_admin());

-- A user can insert their own profile (used by supabaseSync.ts)
create policy "Users can insert own profile"
on public.users for insert
with check (uid = public.get_firebase_uid());

-- A user can update their own profile (e.g. display_name, photo_url)
create policy "Users can update own profile"
on public.users for update
using (uid = public.get_firebase_uid());

-- Admins can manage all users (e.g. block users, change roles via dashboard)
create policy "Admins can manage all users"
on public.users for all
using (public.is_admin());
