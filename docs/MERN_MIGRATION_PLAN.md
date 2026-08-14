# NOKLITY MERN Migration Plan

## What changed now
- Added an Express + MongoDB API scaffold under `/Users/ahammodali/Desktop/NOKLITY/noklity_ecomerce_final-version/server`.
- Added Mongo-backed public catalog endpoints:
  - `GET /api/health`
  - `GET /api/products`
  - `GET /api/products/flash-sale`
  - `GET /api/products/:id`
- Updated the frontend product service to try the new API first and automatically fall back to Supabase if the API is unavailable.
- Added local developer scripts:
  - `npm run server:dev`
  - `npm run server:start`
  - `npm run dev:mern`

## Why this is the right first step
The current app is already using React. Replacing React would not make it meaningfully faster by itself.

The main bottleneck is that the browser talks directly to Supabase for almost everything:
- auth
- products
- cart
- wishlist
- orders
- admin CRUD
- file storage
- tenant/site settings

Moving these flows behind an API gives us:
- smaller and more predictable payloads
- room for caching and indexing
- centralized validation and business rules
- a safer path away from Supabase without a full rewrite

## Recommended migration order
1. Public catalog
- Products list
- Product details
- Flash sale
- Search
- Categories

2. Public configuration
- Site settings used by header, footer, SEO, and branding
- Hero banners
- Feature flags / tenant config

3. Customer account
- Auth with JWT + refresh tokens
- Profile
- Addresses
- Wishlist
- Cart

4. Checkout and orders
- Order creation
- Payment submissions
- Delivery integration
- Invoice and order history

5. Admin panel
- Products
- Categories
- Orders
- Media
- Support tickets
- Settings
- API integrations

## Mongo collection suggestions
- `users`
- `products`
- `categories`
- `orders`
- `orderItems`
- `cartItems`
- `wishlistItems`
- `siteSettings`
- `heroBanners`
- `paymentMethods`
- `supportTickets`
- `apiIntegrations`
- `profiles`

## Important note on performance
MERN is not automatically faster than Supabase.

The gains usually come from:
- server-side query shaping
- lean Mongo queries
- proper indexes
- fewer browser round-trips
- pagination
- response caching
- removing repeated client-side joins

## Next best implementation slice
The next safe slice is:
- move `site settings` and `hero banners` to Mongo-backed public endpoints

That would let the home page, header, footer, SEO, and branding load from the new backend without touching checkout or admin auth yet.
