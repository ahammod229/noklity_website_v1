create table if not exists public.upload_tokens (
    token uuid primary key default gen_random_uuid(),
    firebase_uid text not null,
    created_at timestamptz default now()
);

-- Clean up old tokens automatically (e.g., older than 1 hour)
create extension if not exists pg_cron;

-- RPC to generate a token for any authenticated user
create or replace function public.request_upload_token()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid text;
    v_token uuid;
begin
    v_uid := current_setting('request.headers', true)::json->>'x-firebase-uid';
    if v_uid is null then
        raise exception 'Unauthorized: No firebase UID';
    end if;

    insert into public.upload_tokens (firebase_uid) values (v_uid) returning token into v_token;
    return v_token;
end;
$$;

grant execute on function public.request_upload_token() to anon, authenticated;

-- Update Storage RLS for Avatars
drop policy if exists "Users can upload own avatars" on storage.objects;
create policy "Users can upload own avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and (
    exists (
      select 1 from public.upload_tokens
      where token::text = split_part(name, '/', 1)
        and firebase_uid = split_part(name, '/', 2)
        and created_at > now() - interval '1 hour'
    )
    or
    (auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text)
  )
);

drop policy if exists "Users can update own avatars" on storage.objects;
create policy "Users can update own avatars"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and (
    exists (
      select 1 from public.upload_tokens
      where token::text = split_part(name, '/', 1)
        and firebase_uid = split_part(name, '/', 2)
    )
    or (auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text)
  )
);

-- Update Storage RLS for Payment Proofs
drop policy if exists "Users can upload payment proofs" on storage.objects;
create policy "Users can upload payment proofs"
on storage.objects for insert
with check (
  bucket_id = 'payment-proofs'
  and (
    exists (
      select 1 from public.upload_tokens
      where token::text = split_part(name, '/', 1)
        and created_at > now() - interval '1 hour'
    )
    or auth.uid() is not null
  )
);

drop policy if exists "Users can view own payment proofs" on storage.objects;
create policy "Users can view own payment proofs"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and (
    exists (
      select 1 from public.upload_tokens
      where token::text = split_part(name, '/', 1)
    )
    or public.is_admin()
    or owner = auth.uid()
  )
);

-- Payment Proof Admin Policy
drop policy if exists "Admins can manage payment proofs" on storage.objects;
create policy "Admins can manage payment proofs"
on storage.objects for all
using (
  bucket_id = 'payment-proofs'
  and (
    exists (
      select 1 from public.upload_tokens ut
      join public.users u on ut.firebase_uid = u.uid
      where ut.token::text = split_part(name, '/', 1)
        and u.role = 'admin'
    )
    or public.is_admin()
  )
);

