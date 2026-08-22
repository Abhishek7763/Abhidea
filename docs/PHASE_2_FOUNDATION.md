# ABHIDEA Phase 2 — Repository / Tooling Foundation

Status: PASS — tooling closeout complete
Date: 2026-08-22

## Objective

Establish a clean, pinned and verifiable Next.js foundation before application feature work begins.

## Runtime and framework baseline

- Node.js: 24.19.0 LTS
- Next.js: 16.3.2
- React: 19.2.8
- React DOM: 19.2.8
- TypeScript: 6.0.3 with strict mode
- Tailwind CSS: 4.3.0
- ESLint: 9.39.5
- eslint-config-next: 16.3.2
- App Router

ESLint 10 was tested first but rejected after the real CI run exposed incompatibility in the React/Next ESLint plugin chain. ESLint 9.39.5 is pinned because it is supported by the dependency graph currently used by Next.js 16.3.2.

## Foundation added

- pinned `package.json`
- committed npm lockfile
- Node LTS pin through `.nvmrc`
- strict TypeScript configuration
- Next.js configuration
- Tailwind CSS 4/PostCSS setup
- Next.js ESLint flat configuration
- `.gitignore`
- environment variable boundary documented in `.env.example`
- minimal App Router root layout
- baseline `not-found.tsx`
- baseline `error.tsx`
- GitHub Actions repository verification gate
- zero-dependency format hygiene check
- Node 24 built-in automated test baseline

## Environment boundary

Only browser-safe Supabase values are reserved in `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server secrets must not use the `NEXT_PUBLIC_` prefix and will only be introduced when a later phase requires them.

## Verification gate

The repository verification workflow now executes:

1. `npm ci`
2. `npm run format:check`
3. `npm run lint`
4. `npm run typecheck`
5. `npm test`
6. `npm run build`

The test baseline uses Node 24's built-in test runner and currently protects the ABHIDEA Reader document contract, including safe handling of malformed/unknown blocks, unsupported schema versions and duplicate heading IDs/TOC anchors. No additional testing package was introduced.

The Phase 2 closeout CI result was:

- dependency install: PASS
- format check: PASS
- lint: PASS
- strict typecheck: PASS
- automated tests: PASS
- Next.js production build: PASS

## Deployment safety

`main` remains production-only.

`staging` remains the milestone integration branch.

`work/*` remains the active development branch family.

The Phase 2 closeout introduced no Supabase schema/Auth/Storage changes and no runtime product feature.

## Phase 2 gate

PASS.

The repository now has pinned dependencies, strict typing, linting, deterministic format hygiene, an automated test baseline and a production-build CI gate.
