create or replace function public.request_upload_token()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid text;
    v_headers json;
    v_token uuid;
begin
    v_headers := current_setting('request.headers', true)::json;
    v_uid := v_headers->>'x-firebase-uid';
    if v_uid is null then
        raise exception 'Unauthorized: No firebase UID. Headers: %', v_headers::text;
    end if;

    insert into public.upload_tokens (firebase_uid) values (v_uid) returning token into v_token;
    return v_token;
end;
$$;
