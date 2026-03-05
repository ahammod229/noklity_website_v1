-- Tenant productization keys for single-tenant-per-deployment mode.
-- Safe to run multiple times.

insert into public.site_settings (key, value)
values
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
