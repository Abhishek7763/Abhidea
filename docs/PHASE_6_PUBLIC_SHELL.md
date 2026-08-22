# ABHIDEA — Phase 6 Public Shell / Homepage / About

Date: 22 August 2026
Status: Implementation candidate pending CI and staging promotion.

## Implemented

- Shared Public route-group layout
- Sticky responsive header
- Desktop and mobile navigation
- Compact persistent System / Light / Dark theme control
- Skip-to-content keyboard link
- Editorial homepage replacing the foundation preview
- Explore landing page
- Content Type and Subject hubs
- Functional Search route shell using GET query parameters
- About / Creator profile
- Optional two-photo support without fake placeholder photos
- Empty social links hidden automatically
- Public route loading indicator
- Footer with small Admin Login link
- Studio namespace reserved as noindex/private placeholder with no draft/private data
- 404 route navigation
- robots and sitemap route handlers
- Canonical English/Hindi Reader path reservation

## No-fake-content rule

No fake article counts, fake trending data, fake engagement, fake reviews or fabricated published content are shown.
Empty hubs say that no matching published items exist yet.

## Interaction contract

Every visible global navigation target resolves:
- Home
- Explore
- About
- Search
- Admin Login

Homepage Content Type cards resolve to real hub routes.
Explore Subject links resolve to real hub routes.
Search form submits a real GET query and renders a deterministic result/empty state.

## Accessibility / responsive review targets

- semantic header/nav/main/footer
- keyboard skip link
- visible focus inherited from Design System
- mobile menu uses native `details/summary`
- 320px minimum layout support
- reduced-motion rule retained
- Light/Dark/System state persisted locally
- Devanagari sample remains optically separate from Latin typography

## Deferred by plan

- actual published-content database queries
- full Search engine/ranking
- real Reader content rendering
- Supabase Auth/roles
- Studio CMS
- media-backed creator photos
- Studio-managed About/site settings

These remain in their scheduled phases and are not silently mocked.

## Phase 6 Gate

Required before promotion:
1. `npm ci`
2. lint
3. strict typecheck
4. production Next.js build
5. route build has no App Router conflicts
6. manual/public smoke checks on Home, Explore, Search, About, Studio placeholder, robots and sitemap
7. mobile/light/dark sanity review
