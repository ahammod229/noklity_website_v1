# Noklity Product Requirements Document

## Document Overview
- Product: Noklity
- Type: Single-tenant ecommerce storefront and admin platform
- Current stack: React + TypeScript + Vite, Firebase Hosting, Supabase, Supabase Edge Functions
- Primary market: Bangladesh
- Primary business model: Imported electronics, tools, tyres, auto parts, and related accessories
- Current document purpose: Define the product scope, functional requirements, user journeys, technical requirements, business rules, quality standards, and roadmap for the whole application

## 1. Product Vision
Noklity must be a reliable ecommerce platform that helps customers in Bangladesh discover, compare, purchase, and track imported products with a fast, mobile-first shopping experience. The platform must also give operators a practical admin system to manage catalog, orders, payments, delivery, customers, finance, support, content, and branding without requiring code changes for routine business operations.

## 2. Product Goals
### Business goals
- Sell imported products online with a trustworthy, easy-to-use storefront
- Support local payment workflows common in Bangladesh
- Manage inventory, order operations, customer communication, and delivery from one admin panel
- Support white-label / tenant branding so the product can be reused for future deployments
- Improve discoverability through SEO, sitemap, Open Graph, and structured product metadata

### User goals
- Find products quickly from homepage, categories, search, and related products
- View clear product details, pricing, stock, warranty, delivery, and return information
- Complete checkout with minimal friction on mobile and desktop
- Track orders and review purchase history
- Contact support easily by help center, WhatsApp, email, or support ticket

### Operational goals
- Keep data secure with Row Level Security and admin role enforcement
- Avoid broken flows, fake interactions, and incomplete CRUD
- Make the app configurable through admin settings and tenant configuration
- Keep deployment simple on Firebase Hosting with Supabase as backend

## 3. Product Scope
### In scope
- Public storefront
- Customer account area
- Admin dashboard
- Content/legal pages
- SEO foundation
- Payment workflows
- Delivery integration
- Notifications and support
- White-label branding and feature gating

### Out of scope for current PRD baseline
- Marketplace with multiple vendors
- Multi-warehouse inventory logic
- Native mobile app
- Advanced recommendation engine
- Full ERP/accounting integration
- Automated tax/VAT engine

## 4. Target Users
### 4.1 Guest customer
- Browses products, categories, homepage banners, flash sales, and search
- Can add to cart, checkout, and place order if guest checkout is enabled

### 4.2 Registered customer
- Has account, saved addresses, orders, wishlist, profile, and notifications
- Can manage account and review completed purchases

### 4.3 Store admin
- Manages products, orders, categories, reviews, media, hero banners, flash sales, payment methods, customers, finance, settings, content, and support

### 4.4 Business owner / super admin
- Controls branding, plan features, tenant configuration, API settings, deployment behavior, and platform-level settings

## 5. Current Product Modules
### 5.1 Storefront
- Homepage
- Header and footer
- Hero banners
- Category section
- Flash sale section
- Search and filtered listing
- Product detail page
- Related products
- Cart drawer and full cart page
- Checkout
- Payment success/failure pages
- Order success page
- Invoice page
- Help and support pages
- Static content pages under `/page/:slug`

### 5.2 Customer account
- Order history
- Order detail
- Profile
- Addresses
- Notifications
- Security
- Wishlist

### 5.3 Admin
- Overview dashboard
- Finance
- Products
- Orders
- Categories
- Hero banners
- Media control
- Flash sales
- Reviews
- Support
- Settings
- Language
- Customers
- Payment methods
- API management

### 5.4 Platform / system
- White-label tenant config
- Host allowlist
- Feature flags
- Supabase auth and profile management
- Supabase storage for media
- Firebase Hosting deployment
- Sitemap, robots, favicon, OG image, SEO metadata

## 6. Functional Requirements
### 6.1 Homepage
The homepage must:
- Show branded header, search, hero, category section, flash sale section, product sections, and footer
- Load visible products from Supabase
- Support mobile-first layout from 360px width upward
- Display loading states while content loads
- Display empty states if no products or banners exist
- Display error-safe fallbacks if data fails
- Respect tenant branding, logos, theme, and host allowlist

Acceptance criteria:
- Homepage loads without console-breaking errors
- Product cards, images, prices, stock badges, and CTA buttons render correctly
- Hero is swipeable on mobile and clickable
- Category section is useful on mobile and desktop

### 6.2 Product discovery
The product discovery system must support:
- Category browsing
- Search by keyword
- Search by category query parameter
- Related products on product detail page
- Flash sale visibility
- Stock-aware visibility

Acceptance criteria:
- Only active and visible products appear in customer-facing discovery
- Search and category links reflect the current query state
- Product cards show price, stock, image, and actions correctly

### 6.3 Product detail page
The product detail page must:
- Show gallery, product image, title, category, price, stock, and description
- Show warranty, shipping, return, FAQ, compatibility, and specifications when available
- Allow add-to-cart and wishlist if product is in stock
- Show reviews and related products
- Include SEO metadata and structured data

Acceptance criteria:
- Product page works on mobile and desktop
- Image loads correctly and safely
- Out-of-stock products cannot be added to cart
- Breadcrumb/product structured data exists in page source

### 6.4 Cart
The cart system must:
- Support add, remove, quantity update, and clear actions
- Persist through page refresh and browser reopen
- Work for guest and authenticated users
- Prevent invalid quantity or out-of-stock checkout
- Show subtotal and shipping

Acceptance criteria:
- Cart survives refresh and navigation
- Cart count updates instantly in navigation
- Out-of-stock issues are surfaced before order placement

### 6.5 Checkout
Checkout must:
- Work on mobile and desktop
- Support guest checkout when enabled
- Support address selection or address creation
- Support configured payment methods
- Validate all required inputs
- Save order in Supabase
- Clear cart after successful order
- Redirect to success or payment flow screens

Current supported payment flows:
- bKash
- Nogad
- Bank transfer
- Manual verification / payment submission workflows where configured

Acceptance criteria:
- Checkout blocks if address or required payment inputs are missing
- Checkout blocks when stock is insufficient
- Successful order creates order and order_items records
- User receives clear success or failure feedback

### 6.6 Orders
The order module must:
- Save shipping address snapshot
- Save items, price, payment method, status, and payment status
- Support customer order history and detail pages
- Support invoice generation
- Support admin order management, status updates, and payment confirmation
- Support delivery tracking where integration is configured

Business rules:
- Order status values: Pending, Processing, Shipped, Delivered, Cancelled
- Payment status values: pending, paid, failed
- Product deletion must not break historical orders

Acceptance criteria:
- Admin can view and update orders
- Customers can view their own order history
- Invoice and order detail remain readable for completed orders

### 6.7 Product management
Admins must be able to:
- Create products
- Edit products
- Upload primary image and gallery images
- Manage category, pricing, stock, description, warranty, delivery, shipping, FAQ, related products, and flash sale status
- Remove products safely based on order state

Business rules for product deletion:
- If product is tied to pending orders, deletion must be blocked
- If product has non-pending order history, product must be removed from live catalog without breaking historical data
- If product has no order history, it may be hard-deleted

Acceptance criteria:
- Admin CRUD works end to end
- Product image upload works
- Only the selected product is affected by delete/remove

### 6.8 Category management
Admins must be able to:
- Create and edit categories
- Set icon/logo
- Control category visibility in storefront sections

Acceptance criteria:
- Categories appear correctly in homepage and search context
- Mobile presentation is clean and usable

### 6.9 Reviews
The review system must:
- Allow review submission tied to completed purchases
- Show approved reviews on product page
- Let admin moderate reviews

Acceptance criteria:
- Review submission is not a fake prompt
- Review list handles loading, empty, and approved-only states

### 6.10 Help, support, and contact
The support module must:
- Allow customers to contact support
- Support help content, support ticket creation, and contact details
- Provide admin view for support tickets

Acceptance criteria:
- Contact/support info matches admin-managed settings
- Support requests are visible in admin

### 6.11 Finance
The finance module must:
- Show balance overview
- Track ledger-style history
- Record adjustments with timestamps and editor attribution

Acceptance criteria:
- Admin can review and manage finance history
- Changes are auditable

### 6.12 Branding and site settings
Admins must be able to manage:
- Header logo, footer logo, favicon
- Site name, tagline, footer text
- Support email, phone, address, WhatsApp
- Newsletter copy
- Legal page content
- Theme colors and appearance
- Currency and shipping defaults
- Feature flags and tenant/business metadata where permitted

Acceptance criteria:
- Uploaded logo is the only logo shown
- No hardcoded default logo should override uploaded branding
- Changes are reflected on storefront without broken layout

### 6.13 SEO
The SEO module must include:
- Stable default head metadata
- Page-level SEO for homepage, search, product detail, and content pages
- Canonical URLs
- Robots tag
- Open Graph and Twitter tags
- Sitemap generation
- Robots.txt
- Social share image
- Product structured data
- Breadcrumb structured data

Acceptance criteria:
- `https://noklity.com/sitemap.xml` exists
- `https://noklity.com/robots.txt` exists
- Homepage and product pages contain SEO metadata in view-source

## 7. Admin Navigation Requirements
The admin panel must include the following primary views:
- Overview
- Finance
- Products
- Orders
- Categories
- Hero Banners
- Media Control
- Flash Sales
- Reviews
- Support
- Settings
- Language
- Customers
- Payment Methods
- API Management

The admin UI must:
- Be protected from non-admin access
- Support sign out
- Work on mobile, tablet, laptop, and desktop
- Avoid horizontal overflow and hidden actions

## 8. Database Requirements
### Core tables in current schema
- profiles
- products
- user_addresses
- orders
- order_items
- finance_ledger
- cart_items
- wishlist_items
- site_settings
- payment_submissions
- categories
- hero_banners
- payment_methods
- product_reviews
- support_tickets
- api_integrations

### Required database principles
- All business-critical tables must have Row Level Security enabled
- Admin-only actions must be enforced by policies and role checks
- Public read should be allowed only where intended
- Historical order data must remain readable even if product catalog changes

## 9. External Integrations
### 9.1 Supabase
- Authentication
- PostgreSQL data store
- Storage for product and branding media
- Edge Functions
- RLS enforcement

### 9.2 Firebase Hosting
- Production hosting
- SPA rewrite support
- Security headers
- Static asset caching

### 9.3 Payment integrations
- bKash Edge Function payment session creation
- Nogad/manual verification flow
- Bank transfer/manual submission flow

### 9.4 Delivery integration
- Steadfast delivery function and tracking sync

### 9.5 Marketing and SEO
- Google Search Console
- Meta sharing debugger
- Domain verification

## 10. Business Rules
### Catalog visibility
- Customer-facing pages must only show products intended for sale
- Removed products must not accidentally hide the whole catalog

### Product delete/remove
- Pending-order products cannot be deleted
- Historical-order products may be hidden/archived safely
- Non-ordered products may be fully deleted

### Branding
- Uploaded logo must have priority
- Default image-logo fallback must not appear if admin branding exists
- Text fallback is acceptable only when no logo exists

### Guest checkout
- Allowed only if tenant feature flag permits it

### Payment feature control
- Payment method availability depends on feature flags and active configuration

### Host security
- App should only operate on allowed hosts configured for the tenant

## 11. Non-Functional Requirements
### 11.1 Responsiveness
- Mobile first
- Minimum supported width: 360px
- Tablet, laptop, desktop support required
- No hidden critical actions on any breakpoint
- No unintentional horizontal overflow

### 11.2 Accessibility
- Buttons and touch targets must remain easy to tap
- Inputs must remain readable
- Navigation and states must be clear
- Error and success messages must be understandable

### 11.3 Performance
- Lazy load heavy sections when practical
- Optimize images
- Keep Firebase static caching enabled
- Keep search and catalog queries focused
- Avoid unnecessary bundle weight growth

### 11.4 Reliability
- Every async flow must include loading, error, and success handling
- Empty states must be shown when data is absent
- Orders, invoices, and account data must degrade gracefully if data is partially missing

### 11.5 Security
- No hardcoded secret keys in source files
- Use environment variables for client configuration
- Protect admin route and admin-only actions
- Use RLS on Supabase tables
- Avoid exposing sensitive data in URLs or browser storage beyond acceptable client data

## 12. SEO Requirements
### Must-have
- Unique page title for key public pages
- Meta description
- Canonical
- Robots
- OG/Twitter tags
- Valid share image
- Sitemap and robots

### Product SEO
- Product name, description, category, price, availability, image, brand, SKU when available
- Breadcrumb structured data
- Product structured data

## 13. Analytics and Reporting
The product should support:
- Admin overview metrics
- Order volume
- Revenue/balance visibility
- Customer growth indicators
- Notifications for pending operational actions

Future enhancement:
- GA4 ecommerce events
- Conversion funnel analysis
- campaign attribution

## 14. Quality Standards
No feature is considered complete unless:
- It works end to end for real users
- It is usable on mobile and desktop
- It has proper validation
- It has loading state
- It has error handling
- It has empty state if relevant
- It has success feedback where needed
- It does not introduce broken layout or hidden functionality

## 15. Release Readiness Checklist
Before release:
- `npm run build` passes
- Firebase deploy succeeds
- Supabase environment values are correct
- Homepage products load
- Product images render
- Search works
- Cart persists
- Checkout works
- Orders save correctly
- Admin login and admin CRUD work
- Legal pages load
- Invoice works
- Mobile header, search, hero, categories, and flash sale interactions work
- SEO assets are accessible

## 16. Recommended Roadmap
### Phase 1: Stabilization
- Complete current CRUD hardening
- Remove fragile historical dependencies between orders and products
- Improve product snapshotting in orders
- Standardize loading/error/empty states across all admin pages

### Phase 2: SEO and discovery
- Dedicated category landing pages
- More complete product schema fields
- Merchant Center readiness
- Better internal linking

### Phase 3: Operations
- Stronger order deletion/archive lifecycle
- Better customer support workflows
- Refund workflow
- Stock movement history

### Phase 4: Growth
- GA4 ecommerce tracking
- campaign landing pages
- conversion reporting
- promo and coupon engine

## 17. Open Product Gaps to Address Over Time
- Historical orders still rely on live product relationships in parts of the app
- Search is functional but can be expanded with stronger facets and pagination
- Admin mobile UX should continue to be audited regularly
- Some tenant/productization behavior remains single-tenant first, with multi-tenant only scaffolded
- Payment automation and delivery automation can be expanded further

## 18. Definition of Done
A Noklity feature is done only when:
- Requirements are implemented in UI, service, and data layers
- The flow is usable at 360px mobile width and standard desktop widths
- Real data can be created, edited, viewed, and removed safely
- Errors are visible and actionable
- UI states are polished and consistent
- No fake or placeholder behavior remains in the released flow
- The result is deployable to Firebase and works with Supabase in production

## 19. Summary
Noklity is not just a storefront. It is a full ecommerce operating system for a Bangladesh import business, covering catalog, checkout, payments, orders, delivery, support, finance, content, branding, and admin operations. This PRD should be treated as the living product blueprint for future fixes, redesigns, and feature work.
