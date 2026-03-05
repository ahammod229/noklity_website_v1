-- Prevent orders for out-of-stock / inactive products.
-- This keeps stock validation atomic on the database side.

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

grant execute on function public.create_order(jsonb, numeric, jsonb, text) to anon, authenticated;
