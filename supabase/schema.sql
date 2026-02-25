
-- Create a table for public profiles
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  email text unique,
  full_name text,
  phone text,
  role text default 'user',
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user', 'active');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create user_addresses table
create table if not exists user_addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  full_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'United States',
  label text default 'Home',
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table user_addresses enable row level security;

-- Policies for addresses
create policy "Users can view own addresses" on user_addresses
  for select using (auth.uid() = user_id);

create policy "Users can insert own addresses" on user_addresses
  for insert with check (auth.uid() = user_id);

create policy "Users can update own addresses" on user_addresses
  for update using (auth.uid() = user_id);

create policy "Users can delete own addresses" on user_addresses
  for delete using (auth.uid() = user_id);

-- Create orders table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  total_amount decimal(10,2) not null,
  status text default 'Pending' check (status in ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  payment_method text not null,
  shipping_address jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create order_items table
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity int not null,
  price decimal(10,2) not null
);

alter table orders enable row level security;
alter table order_items enable row level security;

-- Drop existing policies to ensure clean state if re-running
drop policy if exists "Users can view own orders" on orders;
drop policy if exists "Admins can view all orders" on orders;
drop policy if exists "Users can insert own orders" on orders;
drop policy if exists "Admins can update orders" on orders;
drop policy if exists "Users can view own order items" on order_items;
drop policy if exists "Admins can view all order items" on order_items;

-- Orders Policies
create policy "Users can view own orders" on orders for select 
  using (auth.uid() = user_id);

create policy "Admins can view all orders" on orders for select 
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Users can insert own orders" on orders for insert 
  with check (auth.uid() = user_id);

create policy "Admins can update orders" on orders for update 
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Order Items Policies
create policy "Users can view own order items" on order_items for select 
  using (exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));

create policy "Admins can view all order items" on order_items for select 
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- RPC Function for atomic order creation
create or replace function create_order(
  order_items jsonb,
  total_amount decimal,
  shipping_address jsonb,
  payment_method text
) returns uuid
language plpgsql
security definer
as $$
declare
  new_order_id uuid;
  item jsonb;
begin
  -- Create Order
  insert into public.orders (user_id, total_amount, status, shipping_address, payment_method)
  values (auth.uid(), total_amount, 'Pending', shipping_address, payment_method)
  returning id into new_order_id;

  -- Insert Items
  for item in select * from jsonb_array_elements(order_items)
  loop
    insert into public.order_items (order_id, product_id, quantity, price)
    values (
      new_order_id,
      (item->>'product_id')::uuid,
      (item->>'quantity')::int,
      (item->>'price')::decimal
    );
    
    -- Optional: Decrement stock
    update public.products
    set stock = stock - (item->>'quantity')::int
    where id = (item->>'product_id')::uuid;
  end loop;

  -- Clear Cart
  delete from public.cart_items where user_id = auth.uid();

  return new_order_id;
end;
$$;
