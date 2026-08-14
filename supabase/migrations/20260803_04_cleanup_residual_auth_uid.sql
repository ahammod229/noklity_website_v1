-- =====================================================================
-- Audit & Cleanup residual policies (support_tickets)
-- =====================================================================

-- 1. Drop existing residual auth.uid() policies
drop policy if exists "Users can create support tickets" on public.support_tickets;
drop policy if exists "Users can view own support tickets" on public.support_tickets;

-- 2. Fix support_tickets schema to work with Firebase text UIDs
alter table public.support_tickets drop constraint if exists support_tickets_user_id_fkey;
alter table public.support_tickets alter column user_id type text using user_id::text;
alter table public.support_tickets add constraint support_tickets_user_id_fkey
foreign key (user_id) references public.users(uid) on delete set null;

-- 3. Recreate policies using public.get_firebase_uid()
create policy "Users can create support tickets"
on public.support_tickets for insert
with check (public.get_firebase_uid() is null or public.get_firebase_uid() = user_id);

create policy "Users can view own support tickets"
on public.support_tickets for select
using (public.get_firebase_uid() = user_id);
