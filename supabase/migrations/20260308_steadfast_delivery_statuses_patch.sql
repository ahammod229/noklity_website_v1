-- Expand delivery status check constraint to match official Steadfast states.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'orders_delivery_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      drop constraint orders_delivery_status_check;
  end if;

  alter table public.orders
    add constraint orders_delivery_status_check
    check (
      delivery_status in (
        'not_created',
        'pending',
        'delivered_approval_pending',
        'partial_delivered_approval_pending',
        'cancelled_approval_pending',
        'unknown_approval_pending',
        'partial_delivered',
        'hold',
        'in_review',
        'created',
        'pending_pickup',
        'picked',
        'in_transit',
        'delivered',
        'cancelled',
        'failed',
        'unknown'
      )
    );
end $$;
