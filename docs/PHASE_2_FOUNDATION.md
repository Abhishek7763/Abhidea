# ABHIDEA Phase 2 — Repository / Tooling Foundation

Status: Verification complete on `work/foundation`
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
- temporary foundation homepage
- baseline `not-found.tsx`
- baseline `error.tsx`
- GitHub Actions verification gate

## Environment boundary

Only browser-safe Supabase values are reserved in `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server secrets must not use the `NEXT_PUBLIC_` prefix and will only be introduced when a later phase requires them.

## Verification gate

The GitHub Actions foundation job executes:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`

A real CI failure was encountered with ESLint 10, diagnosed from the job logs, corrected to ESLint 9.39.5, and re-tested.

After the compatibility correction the CI result was:

- dependency install: PASS
- lint: PASS
- typecheck: PASS
- Next.js production build: PASS

## Deployment safety

Development work remains on `work/foundation`.

`staging` exists as the milestone integration branch.

No new Vercel deployment was created by the foundation work branch or its draft pull request during Phase 2 verification.

`main` remains outside this development work and is not used for iterative foundation commits.

## Phase 2 gate

PASS once the final read-only CI run confirms the committed lockfile and current branch head.

No Supabase production schema changes are part of Phase 2.
