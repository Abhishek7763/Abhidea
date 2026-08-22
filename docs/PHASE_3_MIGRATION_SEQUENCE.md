# ABHIDEA Phase 3 — Migration Sequence

Status: Normalized after security review — no migrations applied yet
Date: 2026-08-22

## Purpose

Create ABHIDEA V1 schema in a reviewable order without mixing design iteration with production DDL. The connected project is currently additive-only: no ABHIDEA public application tables exist.

## Rules

- migration SQL is committed before application
- no secrets in Git
- explicit GRANT + RLS ship together
- failure stops the sequence
- no destructive legacy DROP is required
- advisor/readback verification follows application
- Public always reads the published snapshot, never working content rows

## M00 — read-only preflight

Confirm:

- project ref `zdsanovvmmwfiqjjnxhr`
- PostgreSQL 17
- current public table inventory
- Auth user count
- Storage inventory
- policies/functions/default privileges
- security advisor
- performance advisor

Abort if unexpected real application data appears before migration review completes.

## M01 — safe defaults / private boundary

- create non-exposed `private` schema if absent
- revoke default public-schema table/function/sequence grants from browser roles/service role according to approved matrix
- revoke default function EXECUTE from `PUBLIC`
- leave Supabase-managed `auth`/`storage` schemas intact

Verify `pg_default_acl` and Data API exposed-schema configuration assumptions.

## M02 — Admin authorization base

Create:

- `admin_members`
- partial unique index for maximum one active Owner
- updated-at helper if required
- `private.current_admin_role()`

Apply:

- self-read + Owner membership policies
- Owner can manage Admin rows only
- no general Owner creation/transfer
- explicit helper function privileges

No Owner row is fabricated while Auth has no verified bootstrap user.

## M03 — Content Type + taxonomy dictionaries

Create:

- `content_types`
- `subjects`
- `topics`
- `tags`

Add explicit public-safe SELECT and Admin write policies.

Seed idempotently:

1. Article
2. Book Summary
3. Fact
4. Thought
5. Idea
6. Life Lesson
7. Guide
8. Video Insight

## M04 — working content identity

Create Admin-only:

- `contents`
- `content_localizations`
- `content_drafts`

Add:

- UUID stable identities
- locale `en|hi`
- unique content/locale
- structured document validation baseline
- optimistic `lock_version`
- Trash metadata
- actor attribution checks
- FK/RLS indexes

Do not create a cross-table unique draft slug constraint. Draft conflicts are preflight concerns; live uniqueness belongs to publication.

## M05 — working metadata relationships

Create Admin-only:

- `content_subjects`
- `content_topics`
- `content_tags`

Composite PKs prevent duplicates. No anonymous relationship policy exists.

These are editing-state relationships only. Publish resolves public-safe values into the live snapshot.

## M06 — source library / working citations

Create Admin-only:

- `sources`
- `content_sources`

No public Source table/page in V1. Publication resolves safe ordered citation data into `published_localizations.sources_json`.

## M07 — revisions + live snapshot

Create:

- `content_revisions` (Admin-readable, immutable)
- `published_localizations` (public live snapshot)

Live snapshot includes:

- content/revision/localization identity
- `content_type_id`
- locale/slug/title/summary/body/SEO
- resolved `subjects_json`
- resolved `topics_json`
- resolved `tags_json`
- resolved `sources_json`
- publication state/timestamps

Constraints:

- unique revision number per localization
- unique live/reserved `(locale, slug)`

Public reads only `publication_state='published'`.

## M08 — media registry

Create Admin working model:

- `media_assets`
- `media_usages`

Public metadata access, if needed by Media Service/Public Reader, is limited to assets whose `public_storage_key` is non-null.

No draft object is public merely because its DB metadata exists.

## M09 — private learning notes

Create `private_learning_notes` with Admin-only grants/RLS.

Explicitly test anon and authenticated non-Admin denial.

## M10 — Website control

Create:

- `site_settings`
- `about_profile`
- `social_links`
- `homepage_modules`

Public read rules:

- safe singleton settings/profile
- visible social links
- enabled homepage modules

Admin writes; no arbitrary script/HTML page-builder fields.

## M11 — redirects + activity

Create:

- `redirects`
- `activity_log`

Redirects are public-safe when active; normal use deactivates instead of deleting.

Activity is append-only, Admin-readable and not directly forgeable by ordinary authenticated clients.

## M12 — Storage boundary

Create/configure:

### `media-private`
Private staged Admin uploads.

### `media-public`
Public published/approved optimized variants only.

Add Storage policies so anon/non-Admin cannot write either bucket and cannot read private objects.

Verify a never-published draft upload has no public delivery URL.

## M13 — controlled publish transaction

Implement only after base RLS tests pass.

Transaction:

1. active Admin check
2. expected draft `lock_version`
3. preflight hard blockers
4. resolve working Content Type/taxonomy/source values into public-safe snapshot
5. create immutable revision
6. upsert `published_localizations`
7. promote/resolve approved public media
8. redirect old live slug if changed
9. append activity
10. commit

Prefer `SECURITY INVOKER`. Any necessary definer helper follows the private-schema security rules and never trusts caller-selected identity.

Cache invalidation/public verification happens after DB commit and is reported separately.

## M14 — controlled Trash/unpublish

Implement a transaction that:

1. verifies Admin
2. marks content trashed/archive state as requested
3. archives every live `published_localizations` row for that content
4. appends activity
5. commits
6. invalidates public cache after commit

This prevents a Trash row from remaining live accidentally.

Permanent delete is a distinct Owner-only dependency-checked workflow.

## M15 — safe default seed

Seed only confirmed V1 defaults:

- Content Types
- ABHIDEA brand identity
- Read • Learn • Think • Grow
- approved singleton/default website records

No fake content, metrics, trending or social proof.

Owner membership is created only after a real verified Auth user exists.

## M16 — repeatable security tests

Required allow/deny tests:

### anon
- live EN/HI snapshot readable
- working content/draft/revision/source/note/Admin data denied
- archived publication denied
- hidden link denied
- private media denied
- editorial writes denied

### authenticated non-Admin
- no Studio authority
- no membership/content mutation

### Admin
- stable identity/localization/draft creation works
- autosave attribution/version behavior works
- working taxonomy/source/media management works
- revisions readable but immutable
- Owner creation/promotion denied

### Owner
- Admin membership management works
- ordinary editorial authority works
- destructive actions remain controlled workflows

Prefer pgTAP/repeatable SQL tests where practical.

## M17 — readback/advisor gate

After applying reviewed migrations:

1. list tables + RLS state
2. enumerate grants to `anon`, `authenticated`, `service_role`
3. enumerate policies
4. enumerate functions/function privileges
5. inspect Storage buckets/policies
6. run security advisor
7. run performance advisor
8. confirm no unexpected public object
9. confirm browser env has no service/secret key
10. record migration history

Any unexplained security finding blocks acceptance.

## Rollback philosophy

Before real data exists, a clean reset may be acceptable only with explicit evidence and migration history. After real content/users exist, recovery defaults to corrective forward migrations, not manual destructive dashboard edits.

## Current boundary

This normalized sequence agrees with the security review. It still does not itself authorize production DDL; SQL migration files must be authored and reviewed against the RLS matrix before application.
