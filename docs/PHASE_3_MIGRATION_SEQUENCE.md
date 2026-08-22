# ABHIDEA Phase 3 — Migration Sequence

Status: Planned — no migrations applied yet
Date: 2026-08-22

## Purpose

Define a reviewable, reversible order for creating the ABHIDEA V1 schema without mixing design iteration with production DDL.

The connected Supabase project is currently empty of ABHIDEA application tables, so the first migration is additive. No DROP of historical application tables is required.

## General migration rules

- migration files are created in Git before application
- each migration has one clear responsibility
- migrations are forward-only once applied to the connected project
- no secret values are committed
- all exposed objects use explicit grants
- RLS and grants ship together for each exposed table family
- migration application is followed by security + performance advisors
- failure stops the sequence; do not keep applying later migrations over a failed base
- no migration is considered complete until readback verifies the expected schema/policies

## M00 — preflight / project safety

Read-only checks before DDL:

- confirm target project ref is `zdsanovvmmwfiqjjnxhr`
- confirm PostgreSQL major is 17
- inventory current public tables
- inventory Auth user count
- inventory Storage buckets/objects
- inventory existing policies/functions
- security advisor
- performance advisor

Expected current state at blueprint time:

- public application tables: 0
- security advisor: clean
- performance advisor: clean

Abort if unexpected application data appears before migration review is complete.

## M01 — privilege hardening and private schema

Purpose: create safe defaults before domain objects.

Planned work:

- create `private` schema if absent
- revoke default table/function/sequence grants in `public` from browser roles/service role as defined in the approved RLS matrix
- revoke default function EXECUTE from `PUBLIC`
- grant nothing broadly to `private`
- retain Supabase-managed schemas/settings untouched

No application data created.

Verification:

- inspect `pg_default_acl`
- confirm `private` is not an exposed Data API schema

## M02 — Admin authorization base

Create:

- `public.admin_members`
- indexes/constraints including maximum one active Owner
- updated-at trigger helper if needed
- `private.current_admin_role()`

Security:

- RLS enabled immediately
- self-read + Owner membership policies only
- ordinary membership CRUD cannot create/transfer Owner
- revoke broad function EXECUTE; grant only required helper execution

No Owner row seeded yet because Auth currently has no bootstrap user.

Verification:

- unauthenticated read denied
- authenticated user without membership denied Admin authority
- helper returns null for non-member

## M03 — content types + taxonomy

Create:

- `content_types`
- `subjects`
- `topics`
- `tags`

Add:

- constraints
- indexes
- explicit grants
- public active-row SELECT policies
- Admin manage policies

Seed initial Content Types only after table/policy creation:

1. Article
2. Book Summary
3. Fact
4. Thought
5. Idea
6. Life Lesson
7. Guide
8. Video Insight

Seed operations must be idempotent.

## M04 — stable content identity

Create:

- `contents`
- `content_localizations`
- `content_drafts`

Add:

- stable UUID identities
- locale constraint `en|hi`
- unique localization per content/locale
- draft structured-document checks
- optimistic `lock_version`
- Trash lifecycle metadata
- relevant FK indexes
- RLS/grants

Verification scenarios:

- Admin can create content identity + locale + draft
- anon cannot see localization/draft
- authenticated non-Admin cannot create

## M05 — immutable revisions + live publication snapshot

Create:

- `content_revisions`
- `published_localizations`

Add:

- unique revision number per localization
- unique live `(locale, slug)`
- public `publication_state='published'` policy
- no ordinary UPDATE/DELETE on revisions
- live snapshot indexes

At this stage, publication transaction implementation can be drafted but autonomous public publishing is not enabled without the controlled workflow.

Verification:

- anon cannot query revisions
- anon sees only published snapshots
- archived snapshot is not public

## M06 — taxonomy relationships

Create:

- `content_subjects`
- `content_topics`
- `content_tags`

Add composite PKs, FK indexes and policies.

Anonymous relationship visibility requires linked content with at least one live edition.

## M07 — sources

Create:

- `sources`
- `content_sources`

Security split:

- public can read only `sources.is_public = true`
- working content-source relationships remain Admin-only
- no private editorial notes stored in publicly readable source rows

## M08 — media registry / usage

Create:

- `media_assets`
- `media_usages`

Do not create Storage buckets in this migration yet.

Policies:

- anon reads only public media metadata
- private metadata/usage is Admin-only
- destructive DB deletion is not broadly granted

## M09 — private learning notes

Create:

- `private_learning_notes`

No anon grants.

Admin-only RLS.

Explicitly verify it cannot be reached by public roles.

## M10 — website control

Create:

- `site_settings`
- `about_profile`
- `social_links`
- `homepage_modules`

Seed safe singleton/default rows only where useful.

Public policies:

- safe site settings
- About profile
- visible social links only
- enabled homepage modules only

Admin policies allow controlled editing.

No arbitrary HTML/script fields.

## M11 — redirects + activity log

Create:

- `redirects`
- `activity_log`

Redirects:

- public reads active mappings
- writes Admin/workflow controlled
- no hard delete required for normal use

Activity:

- append-only
- no public read
- Admin read
- ordinary authenticated users cannot forge direct activity entries

## M12 — Storage buckets + Storage RLS

Create/configure:

### `media-private`

- private bucket
- Admin read/upload
- controlled update/delete
- MIME/file-size policy foundation

### `media-public`

- public delivery bucket
- no public write
- write only via Admin/Media workflow
- contains published/approved variants only

Before enabling public delivery, verify a draft upload remains unavailable from an unauthenticated request.

## M13 — publication transaction

Implement the controlled publication operation after table policies are stable.

Transaction requirements:

1. active Admin check
2. expected draft version check
3. structured document/preflight validation boundary
4. next revision number allocation
5. immutable revision insert
6. live snapshot upsert
7. public source/media synchronization
8. old-slug redirect when necessary
9. activity append
10. commit

Preferred security direction:

- transaction runs in trusted server/RPC context
- use `SECURITY INVOKER` where feasible
- if a narrowly scoped `SECURITY DEFINER` helper is necessary, it follows the private-schema rules from the RLS matrix
- no service secret sent to browser

## M14 — seed and bootstrap readiness

Seed only V1-safe application defaults:

- Content Types
- basic site identity: ABHIDEA / Read • Learn • Think • Grow
- default homepage module configuration where confirmed

Do not seed fake analytics, fake content, fake popularity or social proof.

Owner membership is not fabricated. It is created only after a real Supabase Auth user exists and the bootstrap identity has been explicitly verified.

## M15 — database security test suite

Before Phase 3 schema acceptance, execute test scenarios for:

- anon published read
- anon draft denial
- anon revision denial
- anon private-note denial
- hidden social-link denial
- private media denial
- authenticated non-Admin denial
- Admin content CRUD
- Admin revision immutability
- Admin cannot create/promote Owner
- Owner Admin-management path
- service key absent from browser/client configuration

Where practical, encode repeatable SQL/pgTAP tests rather than relying only on manual checks.

## M16 — advisor / readback gate

After migrations are applied:

1. list all public tables with RLS state
2. enumerate policies
3. enumerate grants to `anon`, `authenticated`, `service_role`
4. enumerate functions and function privileges
5. enumerate Storage buckets/policies
6. run Supabase security advisor
7. run Supabase performance advisor
8. confirm no unexpected public table/function exposure
9. confirm no service secret exists in repository/client env
10. record migration history

Any security finding blocks the gate until understood and fixed.

## Rollback philosophy

Because the connected project is new and migrations are additive, rollback during pre-release development should prefer a corrective forward migration rather than destructive manual dashboard edits.

Before real content/users exist, a clean reset may be acceptable only when explicitly justified and backed by migration history. Once real data exists, reset/drop is no longer the default recovery strategy.

## Phase 3 boundary

This sequence defines how schema application will happen; it does not itself authorize DDL.

The Phase 3 security gate requires the schema blueprint + RLS matrix + this sequence to agree before any production schema mutation.
