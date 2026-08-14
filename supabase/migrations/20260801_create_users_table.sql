-- =====================================================================
-- Create the `users` table for Firebase UID-based auth (no Supabase auth)
-- This table is used by supabaseSync.ts to store Firebase user profiles.
-- The `role` column determines admin access in the frontend.
-- =====================================================================

create table if not exists public.users (
  uid text not null primary key,
  email text unique,
  display_name text,
  photo_url text,
  phone text,
  provider text not null default 'email' check (provider in ('email', 'google')),
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'blocked')),
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- Disable RLS on users table so that the frontend can read/write
-- without Supabase auth (we use Firebase auth instead)
alter table public.users disable row level security;

-- Set your admin email here
-- This gives the admin user the admin role immediately
insert into public.users (uid, email, display_name, role, status)
values (
  'PLACEHOLDER_FIREBASE_UID',
  'noklit ybd@gmail.com',
  'Admin User',
  'admin',
  'active'
)
on conflict (uid) do nothing;

-- Also update by email in case they already exist
update public.users
set role = 'admin', status = 'active'
where lower(email) = 'noklitybd@gmail.com';
