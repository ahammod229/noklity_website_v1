-- NOKLITY avatar upload fix
-- Run this in Supabase SQL Editor for existing projects that show "Bucket not found" on profile photo upload.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view avatars" on storage.objects;
drop policy if exists "Users can upload own avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;
drop policy if exists "Users can delete own avatars" on storage.objects;

create policy "Public can view avatars"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can upload own avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own avatars"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own avatars"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);
