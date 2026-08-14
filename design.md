# NOKLITY Design Guide

## Purpose

This file defines the design direction for the NOKLITY storefront and admin panel. It should be used as the default reference when building or updating pages, components, forms, tables, modals, and dashboards.

The goal is a user-first ecommerce experience that feels:

- fast
- clear
- premium
- mobile-friendly
- trustworthy
- easy to use for both customers and admins

## Product Context

NOKLITY is a white-label ecommerce storefront with:

- public shopping pages
- account and checkout flows
- admin product and order management
- tenant-based branding and configuration

The UI must support real usage on:

- mobile phones
- tablets
- laptops
- large desktop screens

## Core Design Principles

### 1. Clarity First

Users should understand what to do immediately.

- Primary actions must stand out clearly.
- Secondary actions should stay visible but quieter.
- Avoid crowded layouts and unnecessary decoration.
- Important information must appear above the fold on mobile whenever possible.

### 2. Fast-Feeling UX

The app should feel lightweight even when data is still loading.

- Show useful skeletons or loaders quickly.
- Never block the whole UI for non-critical data.
- Defer non-essential work until after first render.
- Use progressive loading for images and large page sections.

### 3. Consistent Structure

Patterns should repeat across the app.

- The same button style should mean the same thing everywhere.
- Form validation should behave the same way on every screen.
- Cards, tables, drawers, and panels should share the same spacing rhythm.

### 4. Mobile-First Responsiveness

The smallest screen is the default target.

- Design for narrow screens first.
- Enhance layouts as screen width increases.
- Never hide key actions only on mobile.
- Avoid horizontal scrolling except where truly necessary.

### 5. Trust and Readability

This is a commerce product. The interface should feel safe and dependable.

- Pricing, inventory, and checkout information must be easy to scan.
- Form errors must be specific and helpful.
- Feedback states should confirm success, loading, and failure clearly.

## Brand and Visual System

### Brand Defaults

Current default tenant branding:

- Brand name: `NOKLITY`
- Domain: `noklity.com`
- Currency: `BDT`
- Timezone: `Asia/Dhaka`

### Color Tokens

Base colors come from CSS variables and tenant config.

- Primary: `#e11d48`
- Primary hover: `#be185d`
- Secondary / accent: `#0f172a`
- Success: `#16a34a`
- Warning: `#f59e0b`
- Danger: `#dc2626`

Light theme surface tokens:

- Background: `rgb(255 255 255)`
- Surface: `rgb(255 255 255)`
- Text: `rgb(17 24 39)`
- Muted text: `rgb(107 114 128)`
- Border: `rgb(229 231 235)`

Dark theme tokens exist and should continue to use the same semantic color roles rather than hardcoded replacements.

### Typography

Default font family:

- `Inter`, sans-serif

Typography direction:

- Large headings should feel bold and compact.
- Labels and metadata can use uppercase tracking when appropriate.
- Body copy must remain easy to read at smaller sizes.
- Avoid oversized paragraphs and low-contrast muted text.

### Radius and Shape

Base radius token:

- `12px`

Component style direction:

- cards: soft rounded corners
- inputs: clear rounded corners with strong focus states
- buttons: rounded, bold, and clearly tappable
- premium sections can use larger rounded containers for emphasis

## Responsive Breakpoints

The app follows a Bootstrap-style breakpoint map.

- `xs`: default, under `576px`
- `sm`: `576px` to `767px`
- `md`: `768px` to `991px`
- `lg`: `992px` to `1199px`
- `xl`: `1200px` to `1399px`
- `xxl`: `1400px` and above

Implementation references:

- `tailwind.config.cjs`
- `constants/breakpoints.ts`
- `styles/theme.css`

## Layout Patterns

### Storefront

The storefront should feel energetic but controlled.

- Use strong product imagery.
- Keep hero areas visually striking but not heavy.
- Product cards should prioritize image, title, price, stock, and CTA.
- Category and filter sections should remain easy to use on touch devices.

### Product Detail Page

The product page must help users decide quickly.

- Keep product image gallery fast and responsive.
- Show title, price, availability, and add-to-cart actions early.
- Specifications and details should be scannable.
- Related content must not distract from the purchase path.

### Auth Pages

Login and signup should feel simple and calm.

- Keep layouts narrow and centered.
- Use minimal distractions.
- Errors should appear directly near the input or action area.
- Success and redirect behavior should feel immediate.

### Account Pages

Account pages should feel organized and reassuring.

- Preserve a simple sidebar or tab pattern.
- Use clean cards with clear section titles.
- Editing states must be obvious.

### Admin Dashboard

Admin surfaces should optimize efficiency.

- Prioritize dense but readable layouts.
- Actions should remain available on smaller screens.
- Tables must degrade gracefully on mobile.
- CRUD flows must be complete and predictable.

## Component Rules

### Buttons

- Primary buttons use the primary brand color.
- Destructive actions use danger color.
- Disabled buttons must still be readable.
- Tap targets should feel comfortable on mobile.

### Forms

- Every form needs validation.
- Required fields must be obvious.
- Errors should explain what needs fixing.
- Success feedback should confirm saved or submitted state.
- Avoid one-by-one data entry when batch input is more practical.

### Cards

- Cards should group related information clearly.
- Avoid overly deep shadows.
- Use spacing, borders, and hierarchy before adding decoration.

### Tables

- Tables should prioritize readability over density.
- On smaller screens, convert overflow-heavy layouts into stacked or simplified patterns when needed.
- Bulk actions must remain discoverable.

### Modals and Drawers

- Use them only for focused tasks.
- Users must always have a clear way to close them.
- The main action should be visually dominant.

### Toasts and Status Feedback

- Success messages should be short and direct.
- Error messages should explain the problem in plain language.
- Loading states should appear quickly and not freeze unrelated UI.

## Accessibility Standards

All new UI should meet these minimum expectations:

- keyboard accessible interactions
- visible focus states
- sufficient contrast
- labels for form controls
- alt text for meaningful images
- no color-only communication for critical states

Responsive accessibility matters too:

- text must stay readable on small screens
- touch targets should not be cramped
- sticky elements must not block important content

## Performance and Weight

The design should support fast first load and fast first interaction.

- Lazy-load large pages and secondary routes.
- Avoid oversized images.
- Use progressive image loading where possible.
- Do not block login, product view, or checkout on non-essential queries.
- Keep above-the-fold UI light.

If two design options are equally attractive, prefer the lighter and faster one.

## Theming and White-Label Support

This app is tenant-aware, so design decisions must respect runtime branding.

- Use semantic tokens instead of hardcoded brand colors when possible.
- Logos, site names, and tenant colors must swap cleanly.
- Layout quality must remain strong even when branding changes.

## Definition of Done for UI Work

A UI task is not complete unless it:

- works on mobile and desktop
- has loading, empty, success, and error states
- supports real interaction end to end
- matches the established design tokens
- avoids broken spacing, overflow, and hidden actions
- feels fast enough for real users

## Reference Files

Current design behavior is mainly driven by:

- `styles/theme.css`
- `tailwind.config.cjs`
- `constants/breakpoints.ts`
- `config/tenant.json`
- `components/`
- `pages/`

