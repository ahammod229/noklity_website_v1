# Upgrade Guide

Use this when updating an existing deployment to a newer code version.

## 1) Backup first
1. Export Supabase DB backup.
2. Backup `site_settings` table.
3. Keep a copy of `.env.local`.

## 2) Pull new code and dependencies
1. Update source code.
2. Run:
   - `npm install`

## 3) Apply DB changes
1. Run new migration files in order from:
   - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/supabase/migrations`
2. Ensure tenant keys exist in `site_settings`:
   - `tenant_plan_name`
   - `tenant_feature_flags`
   - `tenant_license_key`
   - `tenant_license_status`
   - branding/business tenant keys

## 4) Validate configuration
1. Run:
   - `npm run test:productization`
2. Fix any missing keys/files before deploy.

## 5) Build and deploy
1. Build:
   - `npm run build`
2. Deploy static output from `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/dist`.

## 6) Post-upgrade verification
1. Open admin and verify plan/license state.
2. Verify logo/site name/support details on storefront.
3. Verify at least one payment flow and one support ticket flow.
4. Verify disabled plan features are blocked in UI and service layer.

## Optional multi-tenant roadmap upgrade
- Scaffold exists in:
  - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/supabase/migrations/20260301_multitenant_scaffold.sql`
- Do not enable in production until all queries are tenant-scoped.
