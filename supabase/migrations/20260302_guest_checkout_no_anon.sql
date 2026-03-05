-- Allow guest checkout without Supabase anonymous auth.
-- Run this migration in Supabase SQL editor for existing projects.

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
    insert into public.order_items (order_id, product_id, quantity, price)
    values (
      new_order_id,
      (item->>'product_id')::uuid,
      (item->>'quantity')::integer,
      (item->>'price')::numeric
    );

    update public.products
    set stock = greatest(stock - (item->>'quantity')::integer, 0)
    where id = (item->>'product_id')::uuid;
  end loop;

  if current_user_id is not null then
    delete from public.cart_items where user_id = current_user_id;
  end if;

  return new_order_id;
end;
$$;

grant execute on function public.create_order(jsonb, numeric, jsonb, text) to anon, authenticated;
