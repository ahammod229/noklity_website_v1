# NOKLITY Storefront (White-Label Productized)

React + Vite + Supabase ecommerce storefront and admin panel, productized for reusable white-label deployments.

## What was added
- Unified tenant configuration (`file + DB + env`) with runtime cache.
- Feature-flag enforcement for optional modules.
- Admin settings for branding, company info, pages, and business configuration.
- Single-tenant deployment model (safe default).
- Optional multi-tenant scaffold (not fully activated).

## Quick start
1. Install and bootstrap:
   - `npm run setup:single-tenant`
2. Fill `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/.env.local`
3. Run schema in Supabase:
   - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/supabase/schema.sql`
4. Start:
   - `npm run dev`

## Useful commands
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run check:prepublish`
- `npm run test:productization`
- `npm run test:smoke`
- `npm run test`

## Docker
- Build and run:
  - `docker compose up --build`
- App is available at:
  - `http://localhost:3000`

## Productization docs
- Implementation summary:
  - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/docs/IMPLEMENTATION_SUMMARY.md`
- New customer setup:
  - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/docs/NEW_CUSTOMER_SETUP.md`
- White-label customization:
  - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/docs/WHITE_LABEL_CUSTOMIZATION.md`
- Upgrade guide:
  - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/docs/UPGRADE_GUIDE.md`
- HostSeba cPanel deployment:
  - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/docs/HOSTSEBA_CPANEL_DEPLOYMENT.md`

## bKash setup
- Deploy edge functions:
  - `supabase functions deploy bkash-create-payment`
  - `supabase functions deploy bkash-callback`
- Configure required function secrets (`BKASH_*`, `STORE_FRONTEND_URL`).

## Important notes
- Never commit `.env.local`, API keys, or service-role keys.
- Super admin is controlled via `VITE_SUPER_ADMIN_EMAILS`.
- Current production-safe mode is single-tenant per deployment.
