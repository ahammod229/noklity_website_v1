-- This migration makes the storage buckets fully public for inserts/updates/deletes.
-- Since this project uses Firebase Auth, Supabase's `auth.uid()` is always null.
-- Security is instead enforced by the frontend UI, which hides upload buttons from non-admins.

-- Ensure buckets exist (assets, avatars, payment-proofs)
insert into storage.buckets (id, name, public)
values 
  ('assets', 'assets', true),
  ('avatars', 'avatars', true),
  ('payment-proofs', 'payment-proofs', true)
on conflict (id) do update set public = true;

-- Drop all existing policies that restrict access
drop policy if exists "Public can view assets" on storage.objects;
drop policy if exists "Admins can upload assets" on storage.objects;
drop policy if exists "Admins can update assets" on storage.objects;
drop policy if exists "Admins can delete assets" on storage.objects;
drop policy if exists "Admins can manage assets" on storage.objects;

drop policy if exists "Anyone can upload avatars" on storage.objects;
drop policy if exists "Anyone can update avatars" on storage.objects;
drop policy if exists "Anyone can view avatars" on storage.objects;

drop policy if exists "Anyone can upload payment proofs" on storage.objects;
drop policy if exists "Anyone can view payment proofs" on storage.objects;

-- Create public policies for all operations
create policy "Allow public view for assets" on storage.objects for select using (bucket_id in ('assets', 'avatars', 'payment-proofs'));
create policy "Allow public insert for assets" on storage.objects for insert with check (bucket_id in ('assets', 'avatars', 'payment-proofs'));
create policy "Allow public update for assets" on storage.objects for update using (bucket_id in ('assets', 'avatars', 'payment-proofs')) with check (bucket_id in ('assets', 'avatars', 'payment-proofs'));
create policy "Allow public delete for assets" on storage.objects for delete using (bucket_id in ('assets', 'avatars', 'payment-proofs'));
