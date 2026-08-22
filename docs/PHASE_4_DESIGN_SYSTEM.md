# ABHIDEA Phase 4 — Design System Foundation

Status: Implementation candidate
Date: 2026-08-22
Branch: `work/design-system`

## Objective

Establish one reusable visual/accessibility foundation before building the full Public site, Reader and Studio.

## Implemented

- Semantic color tokens for light and dark application themes
- Independent Eye Comfort Reader palette
- Responsive spacing, radius, shadow and content-width tokens
- Inter UI typography
- Newsreader English editorial typography
- Noto Sans Devanagari UI typography
- Noto Serif Devanagari Reader typography
- Responsive display/title/heading/body scales
- Reader-specific line height and measure
- Button, field, badge, callout, surface and status primitives
- Visible keyboard focus states
- Reduced-motion handling
- System/light/dark preference switcher using browser-local preference
- Bilingual English/Hindi Reader sample
- First stable foundation landing page

## Theme rules

1. `system` follows the operating-system color preference.
2. Explicit `light` or `dark` is stored only in browser localStorage.
3. Content/database state never stores UI theme preference in V1.
4. Eye Comfort changes Reader colors independently from the shell theme.
5. Theme initialization runs before interactive hydration to reduce theme flash.

## Accessibility contract

- Interactive controls expose visible `:focus-visible` treatment.
- Theme buttons expose `aria-pressed` state.
- Reader samples use language metadata for Hindi typography.
- `prefers-reduced-motion` disables non-essential smooth scrolling, transforms and long animation durations.
- Text hierarchy remains usable down to the 320px minimum viewport target.
- Controls use minimum practical touch heights around 44px.

## First stable build gate

Before promotion to production:

- `npm ci` passes from the committed lockfile
- ESLint passes
- strict TypeScript/type generation passes
- `next build` passes
- staging PR is mergeable
- production deployment uses `main`, not a work branch
- Vercel deployment reaches READY state
- public deployment URL responds successfully through Vercel verification tooling

## Not included yet

The first stable build is intentionally a foundation milestone, not the full ABHIDEA product. It does not yet include:

- production content feed
- Supabase content schema
- final Reader controls
- search
- taxonomy pages
- About page
- Studio authentication/editor
- PWA

Those continue phase-by-phase after this stable deployment checkpoint.
