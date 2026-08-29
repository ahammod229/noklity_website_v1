-- NOKLITY products image bucket setup
-- Run this in Supabase SQL Editor if the "products" bucket is missing.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products',
  'products',
  true,
  10485760,  -- 10 MB per file
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/jpg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Drop old policies if exist
drop policy if exists "Anyone can view product images" on storage.objects;
drop policy if exists "Admins can upload product images" on storage.objects;
drop policy if exists "Admins can update product images" on storage.objects;
drop policy if exists "Admins can delete product images" on storage.objects;

-- Public read access (product images are always public)
create policy "Anyone can view product images"
on storage.objects for select
using (bucket_id = 'products');

-- Authenticated users (admins) can upload
create policy "Admins can upload product images"
on storage.objects for insert
with check (
  bucket_id = 'products'
  and auth.role() = 'authenticated'
);

-- Authenticated users can update
create policy "Admins can update product images"
on storage.objects for update
using (
  bucket_id = 'products'
  and auth.role() = 'authenticated'
)
with check (
  bucket_id = 'products'
  and auth.role() = 'authenticated'
);

-- Authenticated users can delete
create policy "Admins can delete product images"
on storage.objects for delete
using (
  bucket_id = 'products'
  and auth.role() = 'authenticated'
);
