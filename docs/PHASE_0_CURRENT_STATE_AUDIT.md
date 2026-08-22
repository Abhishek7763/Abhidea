# ABHIDEA — Phase 0 Current State Audit

Date: 22 August 2026
Branch: `work/foundation`

## Scope

This audit records the verified current state before major implementation begins. No destructive migration or production rewrite is authorized by this document.

## GitHub

- Repository: `Abhishek7763/Abhidea`
- Visibility: Public
- Default branch: `main`
- Current application state before rebuild: placeholder-only static HTML
- Root inventory at audit time: `index.html`
- Existing code is not a Next.js application and is not suitable as the long-term ABHIDEA foundation.

## Supabase

Current connected project:
- Name: `Abhidea`
- Region: `ap-south-1`
- PostgreSQL engine: 17
- Status: healthy

Verified current state:
- public application tables: 0
- auth users: 0
- storage buckets: 0
- storage objects: 0
- edge functions: 0
- current public RLS policies: 0 because no application tables exist yet

Important distinction:
Earlier Drive research/snapshots may refer to a different historical Supabase project. Historical schema material is reference evidence only and must not be treated as the current database source of truth.

## Vercel

- Project: `abhidea`
- Git repository linked: `Abhishek7763/Abhidea`
- Plan: Hobby
- Node version: 24.x
- Framework detection at audit time: none, because repository is not yet a Next.js app
- Earlier production deployments include successful READY deployments.
- Latest redeploy attempts observed during Phase 0 returned `git_info_fail`; this is tracked as an operational issue rather than an application compilation failure.

## Google Drive

ABHIDEA research/planning assets are accessible and should be used as evidence when exact prior research claims matter. Drive is not the production database.

## KEEP / REFACTOR / REPLACE

### KEEP
- GitHub repository identity
- Current Vercel project/linkage
- Current clean Supabase project
- Node 24 LTS direction
- Google Drive research/backups
- Modular monolith architecture

### REFACTOR / CONFIGURE
- Vercel Git/deployment behavior
- Branch workflow
- Public/preview protection settings before launch

### REPLACE
- Placeholder static `index.html` application
- Legacy Spoon-Knife remnants/references

### DO NOT RESTORE BLINDLY
- Historical Supabase schemas/migrations from older project references

## Key Risks

1. Historical Drive documents may describe a different Supabase project.
2. Work branches must not create unnecessary Vercel preview deployments.
3. Current public alias/protection behavior must be reviewed before launch.
4. Security must be built server/database-side from the first real schema migration.
5. Public and Studio code paths must remain separated to avoid unnecessary client JavaScript.

## Phase 0 Gate

PASS.

The repository is suitable for a clean Next.js rebuild because no production-grade application code currently needs preservation inside this repository.
