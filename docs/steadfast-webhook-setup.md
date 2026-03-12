# Steadfast Webhook Setup

Use this to enable automatic parcel status updates from Steadfast to your orders table.

## 1) Set webhook token in Supabase Edge secrets

Run from project root:

```bash
npx supabase secrets set STEADFAST_WEBHOOK_TOKEN=sf_webhook_your_random_secure_token --project-ref itcrzohckqrfhfxgtemx
```

## 2) Deploy webhook function

```bash
npx supabase functions deploy steadfast-webhook --project-ref itcrzohckqrfhfxgtemx
```

## 3) Add values in Steadfast dashboard

Open: `steadfast.com.bd/user/webhook/add`

- Callback URL:
  `https://itcrzohckqrfhfxgtemx.supabase.co/functions/v1/steadfast-webhook`
- Auth Token (Bearer):
  `sf_webhook_your_random_secure_token`

Then click **Save**.

## 4) Test

1. Create/track parcel from admin order screen.
2. Change parcel status in Steadfast (or wait for event).
3. In your app order details/admin orders, click tracking sync or refresh.
4. Order delivery fields should update automatically.

## Notes

- Do **not** use Supabase CLI login URL as webhook callback URL.
- If token does not match exactly, webhook requests are rejected with `401 Invalid webhook token`.
- Function file: `supabase/functions/steadfast-webhook/index.ts`
