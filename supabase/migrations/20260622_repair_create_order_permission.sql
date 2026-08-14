-- Repair checkout RPC permissions on existing production projects.
-- This is intentionally re-runnable: it recreates the function with the current
-- stock guard and grants execute to the roles used by Supabase clients.

alter table public.orders
  alter column user_id drop not null;

alter table public.orders
  drop constraint if exists orders_user_id_fkey;

alter table public.orders
  add constraint orders_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

create or replace function public.create_order(
  order_items jsonb,
  total_amount numeric,
  shipping_address jsonb,
  payment_method text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  current_user_id uuid;
  item jsonb;
  requested_qty integer;
  product_row record;
begin
  current_user_id := auth.uid();

  if payment_method not in ('bkash', 'nogad', 'bank_transfer', 'cod', 'card', 'wallet') then
    raise exception 'Unsupported payment method: %', payment_method;
  end if;

  insert into public.orders (
    user_id,
    total_amount,
    status,
    shipping_address,
    payment_method,
    payment_status
  )
  values (
    current_user_id,
    total_amount,
    'Pending',
    shipping_address,
    payment_method,
    'pending'
  )
  returning id into new_order_id;

  for item in select * from jsonb_array_elements(order_items)
  loop
    requested_qty := greatest((item->>'quantity')::integer, 0);

    if requested_qty < 1 then
      raise exception 'Invalid quantity for product %', (item->>'product_id');
    end if;

    select id, title, stock, status, is_active
      into product_row
    from public.products
    where id = (item->>'product_id')::uuid
    for update;

    if not found then
      raise exception 'Product not found: %', (item->>'product_id');
    end if;

    if coalesce(product_row.is_active, true) = false or coalesce(product_row.status, 'active') <> 'active' then
      raise exception 'Product is unavailable: %', coalesce(product_row.title, (item->>'product_id'));
    end if;

    if coalesce(product_row.stock, 0) < requested_qty then
      raise exception 'Insufficient stock for % (available %, requested %)',
        coalesce(product_row.title, (item->>'product_id')),
        coalesce(product_row.stock, 0),
        requested_qty;
    end if;

    insert into public.order_items (order_id, product_id, quantity, price)
    values (
      new_order_id,
      (item->>'product_id')::uuid,
      requested_qty,
      (item->>'price')::numeric
    );

    update public.products
    set stock = stock - requested_qty
    where id = (item->>'product_id')::uuid;
  end loop;

  if current_user_id is not null then
    delete from public.cart_items where user_id = current_user_id;
  end if;

  return new_order_id;
end;
$$;

grant execute on function public.create_order(jsonb, numeric, jsonb, text) to anon;
grant execute on function public.create_order(jsonb, numeric, jsonb, text) to authenticated;
grant execute on function public.create_order(jsonb, numeric, jsonb, text) to service_role;
