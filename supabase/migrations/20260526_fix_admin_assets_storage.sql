-- Restore admin access to the shared media bucket after manual Supabase changes.
-- This migration is safe to rerun.

create extension if not exists pgcrypto;

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

update public.profiles
set
  role = 'admin',
  status = 'active'
where lower(email) in ('noklitybd@gmail.com');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assets',
  'assets',
  true,
  10485760,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'image/gif',
    'image/avif',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view assets" on storage.objects;
drop policy if exists "Admins can upload assets" on storage.objects;
drop policy if exists "Admins can update assets" on storage.objects;
drop policy if exists "Admins can delete assets" on storage.objects;
drop policy if exists "Admins can manage assets" on storage.objects;

create policy "Public can view assets"
on storage.objects for select
using (bucket_id = 'assets');

create policy "Admins can upload assets"
on storage.objects for insert
with check (
  bucket_id = 'assets'
  and public.is_admin()
);

create policy "Admins can update assets"
on storage.objects for update
using (
  bucket_id = 'assets'
  and public.is_admin()
)
with check (
  bucket_id = 'assets'
  and public.is_admin()
);

create policy "Admins can delete assets"
on storage.objects for delete
using (
  bucket_id = 'assets'
  and public.is_admin()
);

