-- =====================================================================
-- Fix finance_ledger schema to work with Firebase text UIDs
-- =====================================================================

-- 1. Drop existing foreign key constraint if it somehow survived the profiles drop
alter table public.finance_ledger drop constraint if exists finance_ledger_created_by_fkey;

-- 2. Alter column to text and drop the auth.uid() default
alter table public.finance_ledger alter column created_by drop default;
alter table public.finance_ledger alter column created_by type text using created_by::text;

-- 3. Set the default to public.get_firebase_uid() instead of auth.uid()
alter table public.finance_ledger alter column created_by set default public.get_firebase_uid();

-- 4. Re-establish foreign key to public.users
alter table public.finance_ledger add constraint finance_ledger_created_by_fkey
foreign key (created_by) references public.users(uid) on delete set null;
