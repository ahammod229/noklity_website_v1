# Steadfast: Values To Add (Copy/Paste)

Use these exact values/steps so Steadfast webhook and API settings work.

## A) In your NOKLITY Admin (`/admin` -> API Management)

- Base URL:
  - `https://portal.packzy.com/api/v1`
- API Key:
  - Your Steadfast `Api-Key` from `steadfast.com.bd/user/api`
- Secret Key:
  - Your Steadfast `Secret-Key` from `steadfast.com.bd/user/api`
- Enable:
  - `Enable Steadfast delivery`
  - `Auto-create parcel from admin` (optional)
  - `Allow customer tracking` (recommended)

Then click:
1. `Save Steadfast Settings`
2. `Test Connection`

## B) Generate webhook bearer token (local terminal)

```bash
bash scripts/generate-steadfast-webhook-token.sh
```

Copy the printed token (example format: `sf_webhook_xxxxx`).

## C) Set webhook token secret in Supabase

```bash
npx supabase secrets set STEADFAST_WEBHOOK_TOKEN="<PASTE_GENERATED_TOKEN>" --project-ref itcrzohckqrfhfxgtemx
```

## D) Deploy webhook function

```bash
npx supabase functions deploy steadfast-webhook --project-ref itcrzohckqrfhfxgtemx
```

## E) Fill Steadfast webhook form (`steadfast.com.bd/user/webhook/add`)

- Callback URL:
  - `https://itcrzohckqrfhfxgtemx.supabase.co/functions/v1/steadfast-webhook`
- Auth Token (Bearer):
  - The same token from step **B**

Click `Save`.

## Important

- Do **not** use Supabase CLI login URL as webhook callback URL.
- Do **not** use the device code as webhook token.
- If callback URL or bearer token is wrong, status updates fail with `Invalid webhook token`.

## Demo flow (to verify end-to-end)

1. Create a new order in site/admin.
2. In Admin Orders, create Steadfast parcel (if auto-create is off).
3. Open Steadfast consignments and verify the parcel appears.
4. Change parcel status in Steadfast.
5. Back in NOKLITY, run tracking sync or refresh order details.
