# HostSeba cPanel Production Deployment Guide

This guide is for publishing NOKLITY to HostSeba cPanel with good security and performance defaults.

## 1) Build locally

From project root:

```bash
npm install
npm run test
npm run build
```

The final static output is in `dist/`.

## 2) Prepare environment values

Use `.env.local` for build-time values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAILS`
- `VITE_SUPER_ADMIN_EMAILS`
- Tenant settings (`VITE_TENANT_*`) as needed

Important:

- Never upload service-role keys to frontend.
- Never expose private API keys in Vite `define` config.

## 3) Upload to cPanel

1. Open **cPanel File Manager**.
2. Go to `public_html` (or your domain document root).
3. Remove old app files (keep backups).
4. Upload all files/folders from local `dist/`.
5. Verify `.htaccess` exists in document root (copied from `public/.htaccess`).

## 4) DNS + SSL

1. Point domain to HostSeba hosting IP.
2. Enable SSL certificate in cPanel.
3. Keep HTTPS redirect enabled (already in `.htaccess`).

## 5) Verify after publish

Check these pages:

- Home page load
- Product list and product details
- Checkout
- Admin login and dashboard
- Admin APIs/settings screens

Check browser DevTools:

- No red console errors
- No failed critical requests

## 6) Performance checklist

- Use optimized product images (WebP recommended).
- Keep hero images near recommended dimensions and compressed.
- Avoid uploading very large PNG/JPG (>1MB) unless required.
- Rebuild after changing tenant env settings.

## 7) Security checklist

- `npm run check:prepublish` passes before every release.
- `.env.local` is never uploaded to cPanel.
- Supabase RLS remains enabled.
- Admin emails are restricted to your trusted addresses only.
- Remove any test/demo credentials before go-live.

## 8) Rollback plan

Keep a zip of the previous `dist/` in cPanel backups.  
If a release fails:

1. Delete current `public_html` app files.
2. Upload previous stable build.
3. Clear browser cache and retest.
