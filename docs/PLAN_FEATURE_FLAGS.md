# Plan & Feature Flags Guide

## Plans
- `Basic`
- `Pro`
- `Enterprise`

## Feature keys
- `catalog_public`
- `checkout_guest`
- `payment_bkash`
- `payment_nogad`
- `payment_bank_transfer`
- `support_tickets`
- `hero_banners`
- `flash_sales`
- `product_reviews`
- `media_control`
- `customer_management`
- `multi_currency`
- `advanced_analytics`
- `api_management`
- `custom_pages`

## Plan matrix
| Feature | Basic | Pro | Enterprise |
|---|---:|---:|---:|
| catalog_public | ✅ | ✅ | ✅ |
| checkout_guest | ✅ | ✅ | ✅ |
| payment_bkash | ✅ | ✅ | ✅ |
| payment_nogad | ✅ | ✅ | ✅ |
| payment_bank_transfer | ✅ | ✅ | ✅ |
| support_tickets | ✅ | ✅ | ✅ |
| hero_banners | ❌ | ✅ | ✅ |
| flash_sales | ❌ | ✅ | ✅ |
| product_reviews | ❌ | ✅ | ✅ |
| media_control | ❌ | ✅ | ✅ |
| customer_management | ✅ | ✅ | ✅ |
| multi_currency | ❌ | ✅ | ✅ |
| advanced_analytics | ❌ | ❌ | ✅ |
| api_management | ❌ | ❌ | ✅ |
| custom_pages | ❌ | ✅ | ✅ |

## Enforcement points
- UI gating: admin sidebar and storefront sections.
- Service-layer gating:
  - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/services/orderService.ts`
  - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/services/productService.ts`
  - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/services/paymentService.ts`
  - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/services/supportService.ts`
- Edge function gating:
  - `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/supabase/functions/bkash-create-payment/index.ts`

## License behavior
- License key format:
  - `NXL-PLAN-XXXXXXXX-XXXX`
- Status must be `active`.
- If invalid/inactive:
  - runtime falls back to `Basic` feature profile.
- Super admin can update plan/license from:
  - Admin > Settings > Plans & Features
