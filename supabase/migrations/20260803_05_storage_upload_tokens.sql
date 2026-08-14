create table if not exists public.upload_tokens (
    token uuid primary key default gen_random_uuid(),
    firebase_uid text not null,
    created_at timestamptz default now()
);

-- Clean up old tokens automatically (e.g., older than 1 hour)
create extension if not exists pg_cron;

-- RPC to generate a token for an admin
create or replace function public.request_upload_token()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid text;
    v_token uuid;
    v_is_admin boolean;
begin
    v_uid := current_setting('request.headers', true)::json->>'x-firebase-uid';
    if v_uid is null then
        raise exception 'Unauthorized: No firebase UID';
    end if;
    
    select exists (
        select 1 from public.users
        where uid = v_uid and role = 'admin' and coalesce(status, 'active') = 'active'
    ) into v_is_admin;
    
    if not v_is_admin then
        raise exception 'Unauthorized: User is not an admin';
    end if;

    insert into public.upload_tokens (firebase_uid) values (v_uid) returning token into v_token;
    return v_token;
end;
$$;

grant execute on function public.request_upload_token() to anon, authenticated;

-- Update Storage RLS
drop policy if exists "Admins can upload assets" on storage.objects;
create policy "Admins can upload assets"
on storage.objects for insert
with check (
  bucket_id = 'assets'
  and (
    -- Allow if they have a valid upload token in the path
    exists (
      select 1 from public.upload_tokens
      where token::text = split_part(name, '/', 1)
        and created_at > now() - interval '1 hour'
    )
    or
    -- Fallback for Supabase Auth (if they ever go back to it)
    public.is_admin()
  )
);

drop policy if exists "Admins can update assets" on storage.objects;
create policy "Admins can update assets"
on storage.objects for update
using (
  bucket_id = 'assets'
  and (
    exists (
      select 1 from public.upload_tokens
      where token::text = split_part(name, '/', 1)
        and created_at > now() - interval '1 hour'
    )
    or public.is_admin()
  )
);

drop policy if exists "Admins can delete assets" on storage.objects;
create policy "Admins can delete assets"
on storage.objects for delete
using (
  bucket_id = 'assets'
  and (
    exists (
      select 1 from public.upload_tokens
      where token::text = split_part(name, '/', 1)
        and created_at > now() - interval '1 hour'
    )
    or public.is_admin()
  )
);
