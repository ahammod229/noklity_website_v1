# White-Label Customization Guide

## Configuration precedence
1. `config/tenant.json` (base defaults)
2. DB settings (`site_settings`)
3. Environment overrides (`VITE_TENANT_*`)

## Where to customize

## A) Admin UI (recommended for non-developers)
- Admin > Settings > General:
  - site name
  - URL label
  - support contacts
  - newsletter/footer copy
  - logos and branding assets
- Admin > Settings > Company & Legal Pages:
  - add/edit/remove pages shown in footer and `/page/:slug`
- Admin > Settings:
  - tenant branding/business metadata
  - feature toggles for optional modules

## B) File-based defaults
- Edit:
  - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/config/tenant.json`
- Useful for shipping pre-branded builds.

## C) Environment overrides
- Set any `VITE_TENANT_*` key in `.env.local` for deployment-specific overrides.
- Useful for CI/CD or containerized releases.

## Branding fields available
- `brandName`
- `brandLogoUrl`
- `primaryColor`
- `secondaryColor`
- `supportEmail`
- `companyName`
- `companyAddress`
- `companyPhone`
- `domain`
- `allowedHosts`
- `timezone`
- `currency`
- `featureFlags`

## Notes
- Logo/image guidance and dimension hints are enforced in admin uploads.
- Host allowlist is enforced by app runtime to prevent accidental cross-domain usage.
