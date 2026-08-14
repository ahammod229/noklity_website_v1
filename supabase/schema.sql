-- NOKLITY Supabase schema (re-runnable)
-- Run this entire file in Supabase SQL Editor for a fresh/new project.

create extension if not exists pgcrypto;

-- Generic trigger helper for updated_at columns
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Admin check helper to avoid RLS recursion on profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and coalesce(p.status, 'active') = 'active'
  );
$$;

grant execute on function public.is_admin() to anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

-- Profiles ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users(id) not null primary key,
  email text unique,
  full_name text,
  phone text,
  avatar_url text,
  notification_settings jsonb not null default '{}'::jsonb,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'blocked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists notification_settings jsonb not null default '{}'::jsonb;

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile or admins" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

create policy "Users can view own profile or admins"
on public.profiles for select
using (
  auth.uid() = id
  or public.is_admin()
);

create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins can update all profiles"
on public.profiles for update
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- Auto-create profile row on auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'user',
    'active'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Products ------------------------------------------------------------------
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique,
  brand text,
  model_number text,
  sku text unique,
  description text,
  category text not null default 'Uncategorized',
  price numeric(10,2) not null check (price >= 0),
  discount_price numeric(10,2) check (discount_price is null or discount_price >= 0),
  specifications jsonb default '{}'::jsonb,
  compatibility jsonb default '[]'::jsonb,
  weight numeric(10,3),
  delivery_charge numeric(10,2) default 0,
  warranty text,
  country_of_origin text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  tax_percent numeric(5,2) not null default 0 check (tax_percent >= 0),
  default_delivery_fee numeric(10,2) not null default 0 check (default_delivery_fee >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  image_urls jsonb default '[]'::jsonb,
  delivery_charges jsonb default '{}'::jsonb,
  warranty_months integer default 0 check (warranty_months >= 0),
  warranty_policy text,
  shipping_info text,
  return_policy text,
  faq_text text,
  related_product_ids uuid[] default '{}',
  is_active boolean not null default true,
  rating numeric(2,1) not null default 5.0,
  is_flash_sale boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.products add column if not exists tax_percent numeric(5,2) not null default 0;
alter table public.products add column if not exists default_delivery_fee numeric(10,2) not null default 0;
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists brand text;
alter table public.products add column if not exists model_number text;
alter table public.products add column if not exists sku text;
alter table public.products add column if not exists specifications jsonb default '{}'::jsonb;
alter table public.products add column if not exists compatibility jsonb default '[]'::jsonb;
alter table public.products add column if not exists weight numeric(10,3);
alter table public.products add column if not exists delivery_charge numeric(10,2) default 0;
alter table public.products add column if not exists warranty text;
alter table public.products add column if not exists return_policy text;
alter table public.products add column if not exists country_of_origin text;
alter table public.products add column if not exists status text not null default 'active';
alter table public.products add column if not exists image_urls jsonb default '[]'::jsonb;
alter table public.products add column if not exists delivery_charges jsonb default '{}'::jsonb;
alter table public.products add column if not exists warranty_months integer default 0;
alter table public.products add column if not exists warranty_policy text;
alter table public.products add column if not exists shipping_info text;
alter table public.products add column if not exists faq_text text;
alter table public.products add column if not exists related_product_ids uuid[] default '{}';
alter table public.products add column if not exists is_active boolean not null default true;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();

alter table public.products enable row level security;

drop policy if exists "Public can view products" on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;

create policy "Public can view products"
on public.products for select
using (true);

create policy "Admins can insert products"
on public.products for insert
with check (
  public.is_admin()
);

create policy "Admins can update products"
on public.products for update
using (
  public.is_admin()
);

create policy "Admins can delete products"
on public.products for delete
using (
  public.is_admin()
);

-- Seed a few products if table is empty
insert into public.products (title, description, category, price, stock, image_url, rating, is_flash_sale)
select * from (
  values
    ('Brembo GT Braking Kit', 'High-performance braking kit for premium stopping power.', 'Brakes', 1200.00, 12, 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=1200&auto=format&fit=crop', 4.8, false),
    ('Performance Air Intake', 'Cold air intake system for better airflow and response.', 'Engine', 280.00, 40, 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1200&auto=format&fit=crop', 4.6, true),
    ('Titanium Exhaust System', 'Lightweight exhaust with aggressive tone and flow.', 'Exhaust', 950.00, 18, 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=1200&auto=format&fit=crop', 4.9, false)
) as seed(title, description, category, price, stock, image_url, rating, is_flash_sale)
where not exists (select 1 from public.products);

-- User addresses -------------------------------------------------------------
create table if not exists public.user_addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  full_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'Bangladesh',
  label text default 'Home',
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_addresses enable row level security;

drop policy if exists "Users can view own addresses" on public.user_addresses;
drop policy if exists "Users can insert own addresses" on public.user_addresses;
drop policy if exists "Users can update own addresses" on public.user_addresses;
drop policy if exists "Users can delete own addresses" on public.user_addresses;

create policy "Users can view own addresses"
on public.user_addresses for select
using (auth.uid() = user_id);

create policy "Users can insert own addresses"
on public.user_addresses for insert
with check (auth.uid() = user_id);

create policy "Users can update own addresses"
on public.user_addresses for update
using (auth.uid() = user_id);

create policy "Users can delete own addresses"
on public.user_addresses for delete
using (auth.uid() = user_id);

-- Orders --------------------------------------------------------------------
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  total_amount numeric(10,2) not null check (total_amount >= 0),
  status text not null default 'Pending' check (status in ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  payment_method text not null check (payment_method in ('bkash', 'nogad', 'bank_transfer', 'cod', 'card', 'wallet')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  transaction_id text,
  paid_at timestamp with time zone,
  shipping_address jsonb not null,
  delivery_provider text,
  delivery_consignment_id text,
  delivery_tracking_code text,
  delivery_tracking_url text,
  delivery_status text not null default 'not_created' check (
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
  ),
  delivery_last_synced_at timestamp with time zone,
  delivery_payload jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders add column if not exists delivery_provider text;
alter table public.orders add column if not exists delivery_consignment_id text;
alter table public.orders add column if not exists delivery_tracking_code text;
alter table public.orders add column if not exists delivery_tracking_url text;
alter table public.orders add column if not exists delivery_status text not null default 'not_created';
alter table public.orders add column if not exists delivery_last_synced_at timestamp with time zone;
alter table public.orders add column if not exists delivery_payload jsonb;

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
end $$;

create index if not exists orders_delivery_status_idx on public.orders(delivery_status);
create index if not exists orders_delivery_tracking_code_idx on public.orders(delivery_tracking_code);

create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete restrict not null,
  quantity integer not null check (quantity > 0),
  price numeric(10,2) not null check (price >= 0)
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Users can view own orders" on public.orders;
drop policy if exists "Admins can view all orders" on public.orders;
drop policy if exists "Users can insert own orders" on public.orders;
drop policy if exists "Admins can update orders" on public.orders;

drop policy if exists "Users can view own order items" on public.order_items;
drop policy if exists "Admins can view all order items" on public.order_items;

create policy "Users can view own orders"
on public.orders for select
using (auth.uid() = user_id);

create policy "Admins can view all orders"
on public.orders for select
using (
  public.is_admin()
);

create policy "Users can insert own orders"
on public.orders for insert
with check (auth.uid() = user_id);

create policy "Admins can update orders"
on public.orders for update
using (
  public.is_admin()
);

create policy "Users can view own order items"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = public.order_items.order_id
      and o.user_id = auth.uid()
  )
);

create policy "Admins can view all order items"
on public.order_items for select
using (
  public.is_admin()
);

-- Finance -------------------------------------------------------------------
create table if not exists public.finance_ledger (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('add_funds', 'withdrawal')),
  amount numeric(12,2) not null check (amount > 0),
  note text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.finance_ledger enable row level security;

drop policy if exists "Admins can view finance ledger" on public.finance_ledger;
drop policy if exists "Admins can insert finance ledger" on public.finance_ledger;
drop policy if exists "Admins can update finance ledger" on public.finance_ledger;
drop policy if exists "Admins can delete finance ledger" on public.finance_ledger;

create policy "Admins can view finance ledger"
on public.finance_ledger for select
using (public.is_admin());

create policy "Admins can insert finance ledger"
on public.finance_ledger for insert
with check (public.is_admin());

create policy "Admins can update finance ledger"
on public.finance_ledger for update
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete finance ledger"
on public.finance_ledger for delete
using (public.is_admin());

-- RPC for atomic order creation
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

-- Cart ----------------------------------------------------------------------
create table if not exists public.cart_items (
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  title text not null,
  price numeric(10,2) not null check (price >= 0),
  image text,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, product_id)
);

alter table public.cart_items enable row level security;

drop policy if exists "Users can view own cart" on public.cart_items;
drop policy if exists "Users can insert own cart" on public.cart_items;
drop policy if exists "Users can update own cart" on public.cart_items;
drop policy if exists "Users can delete own cart" on public.cart_items;

create policy "Users can view own cart"
on public.cart_items for select
using (auth.uid() = user_id);

create policy "Users can insert own cart"
on public.cart_items for insert
with check (auth.uid() = user_id);

create policy "Users can update own cart"
on public.cart_items for update
using (auth.uid() = user_id);

create policy "Users can delete own cart"
on public.cart_items for delete
using (auth.uid() = user_id);

-- Wishlist ------------------------------------------------------------------
create table if not exists public.wishlist_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

alter table public.wishlist_items enable row level security;

drop policy if exists "Users can view own wishlist" on public.wishlist_items;
drop policy if exists "Users can insert own wishlist" on public.wishlist_items;
drop policy if exists "Users can delete own wishlist" on public.wishlist_items;

create policy "Users can view own wishlist"
on public.wishlist_items for select
using (auth.uid() = user_id);

create policy "Users can insert own wishlist"
on public.wishlist_items for insert
with check (auth.uid() = user_id);

create policy "Users can delete own wishlist"
on public.wishlist_items for delete
using (auth.uid() = user_id);

-- Site settings --------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute procedure public.set_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "Public can view site settings" on public.site_settings;
drop policy if exists "Admins can insert site settings" on public.site_settings;
drop policy if exists "Admins can update site settings" on public.site_settings;
drop policy if exists "Admins can delete site settings" on public.site_settings;

create policy "Public can view site settings"
on public.site_settings for select
using (true);

create policy "Admins can insert site settings"
on public.site_settings for insert
with check (
  public.is_admin()
);

create policy "Admins can update site settings"
on public.site_settings for update
using (
  public.is_admin()
);

create policy "Admins can delete site settings"
on public.site_settings for delete
using (
  public.is_admin()
);

insert into public.site_settings (key, value)
values
  ('header_logo_light', ''),
  ('header_logo_dark', ''),
  ('footer_logo', ''),
  ('favicon_url', ''),
  ('site_url', 'https://noklity.com'),
  ('site_url_name', 'noklity.com'),
  ('site_name', 'NOKLITY'),
  ('site_tagline', 'Premium Automotive Performance Parts'),
  ('meta_description', 'NOKLITY provides premium automotive performance products.'),
  ('meta_keywords', 'automotive, performance parts, brakes, exhaust, engine'),
  ('footer_text', '© 2024 NOKLITY Automotive. All rights reserved.'),
  ('support_email', 'support@noklity.com'),
  ('support_phone', '+1 (555) 123-4567'),
  ('support_address', '123 Performance Blvd, Speedway City, CA 90210'),
  ('whatsapp_number', '+15551234567'),
  ('facebook_url', ''),
  ('twitter_url', ''),
  ('instagram_url', ''),
  ('youtube_url', ''),
  ('link_bar_image_url', ''),
  ('link_bar_image_link', ''),
  ('newsletter_enabled', 'true'),
  ('newsletter_badge_text', 'Exclusive Club'),
  ('newsletter_title', 'Join the Noklity Club'),
  ('newsletter_description', 'Get exclusive access to limited edition drops, installation guides, and 10% off your first order.'),
  ('newsletter_input_placeholder', 'Enter your email'),
  ('newsletter_button_text', 'Join'),
  ('newsletter_background_image_url', ''),
  ('currency_code', 'BDT'),
  ('currency_locale', 'en-BD'),
  ('base_currency_code', 'BDT'),
  ('exchange_rate_usd', '121.5'),
  ('exchange_rate_inr', '1.45'),
  ('company_about_title', 'About'),
  ('company_about_content', 'NOKLITY is a premium automotive parts platform focused on performance, reliability, and customer-first service.'),
  ('company_contact_title', 'Contact'),
  ('company_contact_content', 'Need help? Contact us by email, phone, WhatsApp, or create a support ticket from the Help page.'),
  ('company_support_title', 'Support'),
  ('company_support_content', 'For technical issues, order updates, and account help, please use our support center. Our team responds as fast as possible.'),
  ('company_shipping_policy_title', 'Shipping Policy'),
  ('company_shipping_policy_content', 'Orders are processed after payment verification. Delivery time depends on location and shipping method.'),
  ('company_return_policy_title', 'Return Policy'),
  ('company_return_policy_content', 'Returns are accepted for eligible products in original condition within the allowed return window.'),
  ('legal_privacy_policy_title', 'Privacy Policy'),
  ('legal_privacy_policy_content', 'We collect only the data required to operate your account, process orders, and improve service quality.'),
  ('legal_terms_of_service_title', 'Terms of Service'),
  ('legal_terms_of_service_content', 'By using this website, you agree to follow our store policies, payment terms, and applicable local laws.'),
  ('legal_payment_policy_title', 'Payment Policy'),
  ('legal_payment_policy_content', 'Supported payment methods are managed from admin settings. Orders are confirmed after successful payment verification.'),
  ('legal_refund_policy_title', 'Refund Policy'),
  ('legal_refund_policy_content', 'Approved refunds are issued to the original payment channel within the applicable processing period.'),
  ('allow_self_signup', 'true'),
  ('require_email_verification', 'true'),
  ('allow_guest_checkout', 'true'),
  ('default_user_role', 'user'),
  ('admin_2fa_required', 'false'),
  ('enforce_strong_password', 'true'),
  ('password_min_length', '8'),
  ('session_timeout_minutes', '120'),
  ('max_login_attempts', '5'),
  ('notification_email', 'support@noklity.com'),
  ('notify_new_order', 'true'),
  ('notify_payment_update', 'true'),
  ('notify_new_customer', 'false'),
  ('notify_support_ticket', 'true'),
  ('tax_enabled', 'true'),
  ('default_tax_rate', '8'),
  ('default_shipping_fee', '15'),
  ('invoice_prefix', 'INV'),
  ('payment_auto_confirm', 'false'),
  ('delivery_provider_steadfast_enabled', 'false'),
  ('delivery_provider_steadfast_auto_create', 'false'),
  ('delivery_provider_steadfast_tracking_enabled', 'true'),
  ('public_api_enabled', 'false'),
  ('enable_cors', 'true'),
  ('api_rate_limit_per_minute', '60'),
  ('webhook_url', ''),
  ('auto_backup_enabled', 'true'),
  ('backup_frequency', 'daily'),
  ('backup_retention_days', '30'),
  ('timezone', 'Asia/Dhaka'),
  ('date_format', 'DD/MM/YYYY'),
  ('maintenance_mode', 'false'),
  ('maintenance_message', 'We are currently performing maintenance. Please check back soon.'),
  ('custom_head_script', ''),
  ('custom_footer_script', ''),
  ('primary_color', '#e11d48'),
  ('accent_color', '#0f172a'),
  ('border_radius_px', '12'),
  ('compact_sidebar', 'false'),
  ('tenant_brand_name', 'NOKLITY'),
  ('tenant_brand_logo_url', ''),
  ('tenant_primary_color', '#e11d48'),
  ('tenant_secondary_color', '#0f172a'),
  ('tenant_support_email', 'support@noklity.com'),
  ('tenant_company_name', 'NOKLITY Automotive'),
  ('tenant_company_address', '123 Performance Blvd, Speedway City, CA 90210'),
  ('tenant_company_phone', '+1 (555) 123-4567'),
  ('tenant_domain', 'noklity.com'),
  ('tenant_allowed_hosts', 'localhost,127.0.0.1,noklity.com,www.noklity.com'),
  ('tenant_timezone', 'Asia/Dhaka'),
  ('tenant_currency', 'BDT'),
  ('tenant_plan_name', 'Enterprise'),
  ('tenant_feature_flags', '{"catalog_public":true,"checkout_guest":true,"payment_bkash":true,"payment_nogad":true,"payment_bank_transfer":true,"support_tickets":true,"hero_banners":true,"flash_sales":true,"product_reviews":true,"media_control":true,"customer_management":true,"multi_currency":true,"advanced_analytics":true,"api_management":true,"custom_pages":true}'),
  ('tenant_license_key', 'NXL-ENTERPRISE-TRIAL0001-0001'),
  ('tenant_license_status', 'active')
on conflict (key) do nothing;

-- Payment submissions ---------------------------------------------------------
create table if not exists public.payment_submissions (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  payment_method text not null check (payment_method in ('bkash', 'nogad', 'bank_transfer')),
  bank_code text,
  document_type text,
  transaction_reference text,
  document_path text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists set_payment_submissions_updated_at on public.payment_submissions;
create trigger set_payment_submissions_updated_at
before update on public.payment_submissions
for each row execute procedure public.set_updated_at();

alter table public.payment_submissions enable row level security;

drop policy if exists "Users can insert own payment submissions" on public.payment_submissions;
drop policy if exists "Users can view own payment submissions" on public.payment_submissions;
drop policy if exists "Admins can manage payment submissions" on public.payment_submissions;

create policy "Users can insert own payment submissions"
on public.payment_submissions for insert
with check (auth.uid() = user_id);

create policy "Users can view own payment submissions"
on public.payment_submissions for select
using (auth.uid() = user_id);

create policy "Admins can manage payment submissions"
on public.payment_submissions for all
using (public.is_admin())
with check (public.is_admin());

-- Private bucket for payment proof documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload payment proofs" on storage.objects;
drop policy if exists "Users can view own payment proofs" on storage.objects;
drop policy if exists "Admins can manage payment proofs" on storage.objects;

create policy "Users can upload payment proofs"
on storage.objects for insert
with check (
  bucket_id = 'payment-proofs'
  and auth.uid() is not null
);

create policy "Users can view own payment proofs"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and (owner = auth.uid() or public.is_admin())
);

create policy "Admins can manage payment proofs"
on storage.objects for all
using (
  bucket_id = 'payment-proofs'
  and public.is_admin()
)
with check (
  bucket_id = 'payment-proofs'
  and public.is_admin()
);

-- Storage bucket for site branding assets -----------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assets',
  'assets',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif', 'image/avif', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view assets" on storage.objects;
drop policy if exists "Admins can upload assets" on storage.objects;
drop policy if exists "Admins can update assets" on storage.objects;
drop policy if exists "Admins can delete assets" on storage.objects;

create policy "Public can view assets"
on storage.objects for select
using (bucket_id = 'assets');

create policy "Admins can upload assets"
on storage.objects for insert
with check (
  bucket_id = 'assets'
  and public.is_admin()
);

create policy "Admins can update assets"
on storage.objects for update
using (
  bucket_id = 'assets'
  and public.is_admin()
)
with check (
  bucket_id = 'assets'
  and public.is_admin()
);

create policy "Admins can delete assets"
on storage.objects for delete
using (
  bucket_id = 'assets'
  and public.is_admin()
);

-- Storage bucket for customer profile avatars -------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view avatars" on storage.objects;
drop policy if exists "Users can upload own avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;
drop policy if exists "Users can delete own avatars" on storage.objects;
drop policy if exists "Admins can manage avatars" on storage.objects;

create policy "Public can view avatars"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can upload own avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own avatars"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own avatars"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Admins can manage avatars"
on storage.objects for all
using (
  bucket_id = 'avatars'
  and public.is_admin()
)
with check (
  bucket_id = 'avatars'
  and public.is_admin()
);

-- Categories -----------------------------------------------------------------
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  slug text not null unique,
  icon text default 'Package',
  logo_url text,
  description text,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories add column if not exists logo_url text;

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute procedure public.set_updated_at();

alter table public.categories enable row level security;

drop policy if exists "Public can view categories" on public.categories;
drop policy if exists "Admins can insert categories" on public.categories;
drop policy if exists "Admins can update categories" on public.categories;
drop policy if exists "Admins can delete categories" on public.categories;

create policy "Public can view categories"
on public.categories for select
using (true);

create policy "Admins can insert categories"
on public.categories for insert
with check (
  public.is_admin()
);

create policy "Admins can update categories"
on public.categories for update
using (
  public.is_admin()
);

create policy "Admins can delete categories"
on public.categories for delete
using (
  public.is_admin()
);

insert into public.categories (name, slug, icon)
values
  ('Brakes', 'brakes', 'Disc'),
  ('Engine', 'engine', 'Cog'),
  ('Exhaust', 'exhaust', 'Wind'),
  ('Electronics', 'electronics', 'Cpu')
on conflict (slug) do nothing;

-- Hero banners ---------------------------------------------------------------
create table if not exists public.hero_banners (
  id uuid default gen_random_uuid() primary key,
  badge_text text not null default 'Premium Selection',
  title text not null,
  highlight_text text,
  description text,
  image_url text not null,
  primary_button_text text not null default 'Shop Now',
  secondary_button_text text not null default 'View Catalog',
  target_type text not null default 'none' check (target_type in ('none', 'product', 'category', 'url')),
  target_product_id uuid references public.products(id) on delete set null,
  target_category text,
  target_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists set_hero_banners_updated_at on public.hero_banners;
create trigger set_hero_banners_updated_at
before update on public.hero_banners
for each row execute procedure public.set_updated_at();

alter table public.hero_banners enable row level security;

drop policy if exists "Public can view active hero banners" on public.hero_banners;
drop policy if exists "Admins can view all hero banners" on public.hero_banners;
drop policy if exists "Admins can insert hero banners" on public.hero_banners;
drop policy if exists "Admins can update hero banners" on public.hero_banners;
drop policy if exists "Admins can delete hero banners" on public.hero_banners;

create policy "Public can view active hero banners"
on public.hero_banners for select
using (is_active = true);

create policy "Admins can view all hero banners"
on public.hero_banners for select
using (public.is_admin());

create policy "Admins can insert hero banners"
on public.hero_banners for insert
with check (public.is_admin());

create policy "Admins can update hero banners"
on public.hero_banners for update
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete hero banners"
on public.hero_banners for delete
using (public.is_admin());

insert into public.hero_banners (
  badge_text,
  title,
  highlight_text,
  description,
  image_url,
  primary_button_text,
  secondary_button_text,
  target_type,
  is_active,
  sort_order
)
select
  'Premium Selection',
  'Genuine',
  'Performance',
  'Unlock your vehicle''s true potential with components engineered for speed, durability, and precision.',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2940&auto=format&fit=crop',
  'Shop Now',
  'View Catalog',
  'none',
  true,
  0
where not exists (
  select 1
  from public.hero_banners
);

-- Payment methods -------------------------------------------------------------
create table if not exists public.payment_methods (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  name text not null,
  type text not null check (type in ('mobile_banking', 'bank_transfer', 'card', 'cash')),
  logo_url text,
  account_details jsonb default '{}'::jsonb,
  instructions text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists set_payment_methods_updated_at on public.payment_methods;
create trigger set_payment_methods_updated_at
before update on public.payment_methods
for each row execute procedure public.set_updated_at();

alter table public.payment_methods enable row level security;

drop policy if exists "Public can view active payment methods" on public.payment_methods;
drop policy if exists "Admins can view all payment methods" on public.payment_methods;
drop policy if exists "Admins can insert payment methods" on public.payment_methods;
drop policy if exists "Admins can update payment methods" on public.payment_methods;
drop policy if exists "Admins can delete payment methods" on public.payment_methods;

create policy "Public can view active payment methods"
on public.payment_methods for select
using (is_active = true);

create policy "Admins can view all payment methods"
on public.payment_methods for select
using (
  public.is_admin()
);

create policy "Admins can insert payment methods"
on public.payment_methods for insert
with check (
  public.is_admin()
);

create policy "Admins can update payment methods"
on public.payment_methods for update
using (
  public.is_admin()
);

create policy "Admins can delete payment methods"
on public.payment_methods for delete
using (
  public.is_admin()
);

insert into public.payment_methods (code, name, type, instructions, is_active, sort_order)
values
  ('bkash', 'bKash', 'mobile_banking', 'Send payment to our bKash merchant account and attach transaction ID at checkout.', true, 1),
  ('nogad', 'Nogad', 'mobile_banking', 'Send payment by Nogad and keep your transaction ID.', true, 2),
  ('bank_transfer', 'Bank Transfer', 'bank_transfer', 'Transfer to our bank account. Order will be confirmed after verification.', true, 3)
on conflict (code) do nothing;

-- Product reviews -------------------------------------------------------------
create table if not exists public.product_reviews (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  comment text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (order_id, user_id, product_id)
);

drop trigger if exists set_product_reviews_updated_at on public.product_reviews;
create trigger set_product_reviews_updated_at
before update on public.product_reviews
for each row execute procedure public.set_updated_at();

alter table public.product_reviews enable row level security;

drop policy if exists "Public can view approved reviews" on public.product_reviews;
drop policy if exists "Users can manage own reviews" on public.product_reviews;
drop policy if exists "Admins can manage all reviews" on public.product_reviews;

create policy "Public can view approved reviews"
on public.product_reviews for select
using (status = 'approved');

create policy "Users can manage own reviews"
on public.product_reviews for all
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.user_id = auth.uid()
      and o.status = 'Delivered'
  )
);

create policy "Admins can manage all reviews"
on public.product_reviews for all
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- Support tickets -------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  channel text not null default 'email' check (channel in ('email', 'whatsapp', 'web')),
  subject text not null,
  message text not null,
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Resolved', 'Closed')),
  priority text not null default 'Normal' check (priority in ('Low', 'Normal', 'High', 'Urgent')),
  admin_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
create trigger set_support_tickets_updated_at
before update on public.support_tickets
for each row execute procedure public.set_updated_at();

alter table public.support_tickets enable row level security;

drop policy if exists "Users can create support tickets" on public.support_tickets;
drop policy if exists "Users can view own support tickets" on public.support_tickets;
drop policy if exists "Admins can manage support tickets" on public.support_tickets;

create policy "Users can create support tickets"
on public.support_tickets for insert
with check (auth.uid() is null or auth.uid() = user_id);

create policy "Users can view own support tickets"
on public.support_tickets for select
using (auth.uid() = user_id);

create policy "Admins can manage support tickets"
on public.support_tickets for all
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- API integrations ------------------------------------------------------------
create table if not exists public.api_integrations (
  id uuid default gen_random_uuid() primary key,
  key text not null unique,
  name text not null,
  base_url text,
  auth_type text not null default 'none' check (auth_type in ('none', 'api_key', 'bearer', 'basic')),
  secret_ref text,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'inactive' check (status in ('active', 'inactive')),
  last_checked_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.api_integrations add column if not exists config jsonb not null default '{}'::jsonb;

drop trigger if exists set_api_integrations_updated_at on public.api_integrations;
create trigger set_api_integrations_updated_at
before update on public.api_integrations
for each row execute procedure public.set_updated_at();

alter table public.api_integrations enable row level security;

drop policy if exists "Admins can manage api integrations" on public.api_integrations;

create policy "Admins can manage api integrations"
on public.api_integrations for all
using (
  public.is_admin()
)
with check (
  public.is_admin()
);
