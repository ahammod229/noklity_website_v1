-- OPTIONAL ROADMAP SCAFFOLD (NOT ENABLED BY DEFAULT)
-- This file prepares basic multi-tenant entities without switching existing
-- business tables/policies yet. Apply only when you are ready for full
-- tenant_id migration and query scoping.

create table if not exists public.tenants (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  name text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.tenant_memberships (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (tenant_id, user_id)
);

-- Tenant-level settings for future migration off global site_settings.
create table if not exists public.tenant_settings (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key text not null,
  value text not null default '',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (tenant_id, key)
);

alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.tenant_settings enable row level security;

drop policy if exists "Admins can manage tenants" on public.tenants;
create policy "Admins can manage tenants"
on public.tenants for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage memberships" on public.tenant_memberships;
create policy "Admins can manage memberships"
on public.tenant_memberships for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage tenant settings" on public.tenant_settings;
create policy "Admins can manage tenant settings"
on public.tenant_settings for all
using (public.is_admin())
with check (public.is_admin());
