-- Steadfast delivery integration
-- Adds secure integration config storage + order-level tracking fields.

alter table public.api_integrations
  add column if not exists config jsonb not null default '{}'::jsonb;

alter table public.orders
  add column if not exists delivery_provider text,
  add column if not exists delivery_consignment_id text,
  add column if not exists delivery_tracking_code text,
  add column if not exists delivery_tracking_url text,
  add column if not exists delivery_status text not null default 'not_created',
  add column if not exists delivery_last_synced_at timestamp with time zone,
  add column if not exists delivery_payload jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_delivery_provider_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_delivery_provider_check
      check (delivery_provider is null or delivery_provider in ('steadfast', 'manual'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_delivery_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_delivery_status_check
      check (delivery_status in (
        'not_created',
        'created',
        'pending_pickup',
        'picked',
        'in_transit',
        'delivered',
        'cancelled',
        'failed',
        'unknown'
      ));
  end if;
end $$;

create index if not exists orders_delivery_status_idx on public.orders(delivery_status);
create index if not exists orders_delivery_tracking_code_idx on public.orders(delivery_tracking_code);

insert into public.site_settings (key, value)
values
  ('delivery_provider_steadfast_enabled', 'false'),
  ('delivery_provider_steadfast_auto_create', 'false'),
  ('delivery_provider_steadfast_tracking_enabled', 'true')
on conflict (key) do nothing;
