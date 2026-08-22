# ABHIDEA Phase 10A — Draft Data Model

Status: Database verification complete — repository gate pending
Date: 2026-08-22
Baseline staging SHA: `e409eb1f3fec6aedf5ffc7e22979f59ae42b47de`
Supabase project: `zdsanovvmmwfiqjjnxhr`

## Purpose

Activate the minimum permanent CMS foundation needed for Phase 10 without changing the current public Reader delivery path.

The public website remains fixture / preview-catalog backed for now. Phase 10A creates only private Studio authoring state plus the fixed V1 content-type dictionary.

## Live-state reconciliation with Phase 3

Phase 3 was a design blueprint written before Studio authorization was implemented. Its `admin_members` / `owner|admin` membership model is superseded by the Phase 9 live authorization source:

- table: `public.studio_members`
- roles: `admin`, `creator`
- status: `active`, `disabled`
- current owner-equivalent account: active `admin`

Phase 10A therefore does **not** create `admin_members`, does not add a separate `owner` role, and does not replace the working Phase 9 auth/session flow.

This is an intentional reconciliation, not schema drift.

## Activated tables

### `content_types`

Fixed V1 controlled dictionary:

1. Article
2. Book Summary
3. Fact
4. Thought
5. Idea
6. Life Lesson
7. Guide
8. Video Insight

Content Type remains separate from Subject.

Only active Studio members can read this dictionary through the authenticated Data API. Only active `admin` members may update V1 dictionary rows. No ordinary browser-role insert/delete path is granted.

### `subjects`

Studio-managed subject taxonomy:

- UUID identity
- name
- lowercase stable slug
- active/inactive state
- created/updated actor attribution
- timestamps

Active `admin` and `creator` members can read, create and update Subjects. Hard delete is intentionally not granted; later workflows can deactivate a Subject instead.

### `contents`

Language-neutral logical content identity:

- UUID identity
- `content_type_id`
- created/updated actor attribution
- timestamps

English and Hindi editions of the same work share this logical identity.

### `content_localizations`

Stable localized edition identity:

- UUID identity
- `content_id`
- locale `en|hi`
- created/updated actor attribution
- timestamps
- unique `(content_id, locale)`

This is the permanent EN/HI linking model used by later Studio UI.

### `content_drafts`

Mutable private authoring state keyed one-to-one by localization:

- title
- slug
- summary
- canonical `body_json`
- editorial status
- optimistic `lock_version`
- created/updated actor attribution
- timestamps

Editorial status is deliberately limited to:

- `draft`
- `needs_review`
- `ready`

Publishing state is not added here. Publish/schedule/revision state belongs to later phases.

### `content_subjects`

Private working relation between a logical content item and one or more Subjects.

Subjects are shared by the logical item rather than duplicated per language edition in Phase 10A.

## Canonical structured body contract

The database requires the same top-level document shape already used by the Reader:

```json
{
  "schemaVersion": 1,
  "blocks": []
}
```

The DB constraint validates that:

- the value is a JSON object
- `schemaVersion` is `1`
- `blocks` is an array

Individual block validation remains in the real Reader parser, which already fails closed on malformed or unknown blocks. Raw HTML is not a canonical storage format.

## Slug policy

Draft slugs are **not globally unique**.

This follows the more precise Phase 3 publication architecture: draft conflicts are allowed to exist temporarily and are resolved by preflight before publication. The real public uniqueness boundary will be `(locale, slug)` on the future live/published snapshot.

Phase 10A adds only a non-unique draft slug lookup index.

Localized slugs may contain Unicode. Draft slug validation blocks whitespace and route-breaking `/`, `?`, `#` characters while allowing the current Roman-Hindi style and future Devanagari-safe slugs.

## RLS / authorization

All Phase 10A application tables have RLS enabled.

`anon` receives no Phase 10A table grants.

Authenticated access is still not sufficient by itself. Policies require a matching `public.studio_members` row where:

- `user_id = auth.uid()`
- `status = 'active'`
- role is `admin` or `creator`

Content Type dictionary updates require active `admin` specifically.

No policy trusts `user_metadata` or any client-supplied role claim.

## Actor attribution

For tables with `created_by` / `updated_by`, a private `SECURITY INVOKER` trigger function stamps the authenticated `auth.uid()` on inserts/updates and preserves the original creator on update.

The trigger helper is stored in the non-exposed `private` schema and direct execute privilege is revoked from browser roles.

`content_subjects.created_by` is checked against `auth.uid()` on insert.

## Deliberately out of Phase 10A

Not activated here:

- public reads of CMS content
- publish/unpublish
- scheduling
- immutable revision history
- redirects
- media/storage
- source library
- topics/tags beyond the currently required Subject flow
- autosave
- draft deletion/trash workflows
- public search integration
- replacement of `src/features/website/site-content.ts`

Those remain later checkpoints so this migration stays additive and reviewable.

## Migrations

Repository migrations:

- `supabase/migrations/20260822201500_phase10a_cms_draft_model.sql`
- `supabase/migrations/20260822203000_phase10a_actor_fk_indexes.sql`

Applied Supabase migration history:

- `20260822144024 phase10a_cms_draft_model`
- `20260822144154 phase10a_actor_fk_indexes`

The second migration is a forward-only performance correction for actor foreign-key indexes reported by the advisor after the first migration.

## Database verification — 2026-08-22

Verified against project `zdsanovvmmwfiqjjnxhr`:

- all six Phase 10A tables exist and have RLS enabled
- all eight V1 content types are present and active
- `anon` has no table privileges on the Phase 10A CMS surface
- authenticated non-Studio RLS simulation sees zero Content Type rows
- active Studio admin RLS simulation sees all eight Content Type rows
- rollback-only authoring probe successfully created Subject → Content → EN Localization → Draft → Subject link
- actor stamping succeeded for Subject, Content, Localization, Draft and Subject link
- default draft state validated as `draft`, `lock_version = 1`, `schemaVersion = 1`
- rollback probe left zero Subjects, Contents, Localizations, Drafts and Subject links behind
- initial unindexed-foreign-key advisor notices were fixed with the follow-up migration

Security advisor currently reports one project-level warning: **Leaked Password Protection Disabled**. It existed before/independently of Phase 10A DDL and does not indicate draft/RLS leakage. Authentication-hardening configuration can be handled separately rather than changing Auth behavior inside this schema migration.

Performance advisor now reports only **unused index** INFO notices. This is expected because the new CMS tables intentionally contain no real content rows yet; required FK/query indexes should not be removed before Phase 10B starts exercising them.

## Acceptance gate

Phase 10A is accepted only after:

1. migration applies successfully to project `zdsanovvmmwfiqjjnxhr` — PASS
2. required tables exist with RLS enabled — PASS
3. all eight V1 content types are present — PASS
4. anon has no draft/editorial table privileges — PASS
5. current active Studio admin can access the CMS model through RLS — PASS
6. security advisor is clean or findings are understood and fixed — PASS (one understood project-level Auth warning)
7. performance advisor is reviewed — PASS (only expected unused-index INFO remains)
8. repository PR CI passes before merge to `staging` — PENDING
9. `main` remains untouched — PASS
