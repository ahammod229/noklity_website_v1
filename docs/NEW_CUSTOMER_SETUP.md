# New Customer Setup Guide (Single-Tenant Per Deployment)

## 1) Create tenant deployment
1. Copy project.
2. Run:
   - `npm run setup:single-tenant`
3. Edit `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/.env.local` with:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_EMAILS`
   - `VITE_SUPER_ADMIN_EMAILS`

## 2) Provision Supabase
1. Create a new Supabase project.
2. Run SQL file:
   - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/supabase/schema.sql`
3. Run migration:
   - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/supabase/migrations/20260301_tenant_productization.sql`
4. Optional if avatar upload fails:
   - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/supabase/avatar_bucket_fix.sql`

## 3) Configure brand + business settings
1. Set base defaults in `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/config/tenant.json`.
2. Start app: `npm run dev`
3. Login as admin and go to:
   - Admin > Settings
4. Set:
   - tenant branding/business fields
   - payment and API settings
   - optional feature flags (if you use module gating)

## 4) Optional bKash sandbox setup
1. Deploy edge functions:
   - `supabase functions deploy bkash-create-payment`
   - `supabase functions deploy bkash-callback`
2. Set function secrets:
   - `BKASH_PROVIDER`
   - `BKASH_BASE_URL`
   - `BKASH_USERNAME`
   - `BKASH_PASSWORD`
   - `BKASH_APP_KEY`
   - `BKASH_APP_SECRET`
   - `BKASH_CALLBACK_URL`
   - `STORE_FRONTEND_URL`

## 5) Verify deployment
1. Run checks:
   - `npm run test:productization`
2. Build smoke test:
   - `npm run test:smoke`
3. Manual checks:
   - branding updates from admin reflect on storefront
   - disabled features are hidden/blocked
   - checkout + selected payment methods work
