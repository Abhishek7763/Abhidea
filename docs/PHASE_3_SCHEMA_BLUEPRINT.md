# ABHIDEA Phase 3 — Database / Security Blueprint

Status: Design only — NOT applied to Supabase
Date: 2026-08-22
Branch: `work/database-blueprint`
Supabase project: `zdsanovvmmwfiqjjnxhr`

## 1. Phase objective

Design the V1 PostgreSQL/Auth/RLS/Storage model before any production DDL is applied.

The current connected Supabase project is intentionally clean:

- public application tables: 0
- Auth users: 0 at Phase 0 audit
- Storage application buckets: 0 at Phase 0 audit
- security advisor findings: 0
- performance advisor findings: 0

No historical ABHIDEA schema will be restored blindly. Earlier Drive snapshots refer to a different Supabase project and are reference material only.

## 2. Security baseline

ABHIDEA will use these rules from the first migration:

1. Every exposed table gets explicit GRANTs and RLS.
2. A table is not considered safe merely because RLS exists; Data API grants are a separate access layer.
3. `service_role` / secret keys never enter browser bundles.
4. Authorization never trusts user-editable `user_metadata`.
5. Owner/Admin authorization is derived from server/database-controlled membership data.
6. Drafts, revisions, private notes and activity internals are never anonymously readable.
7. Public reading is backed by a deliberate published snapshot, not by filtering columns out of a mutable draft row.
8. Security-definer helpers, if required, live in a non-exposed `private` schema, have a fixed search path, accept no caller-controlled identity, and expose the minimum result required by RLS.
9. Views exposed to browser roles must be `security_invoker` where used.
10. `UPDATE` policies include the necessary `SELECT` visibility and both `USING` / `WITH CHECK` rules where ownership/authorization must remain true after the update.
11. Columns used repeatedly by RLS predicates are indexed.
12. All schema changes are migration-backed and re-checked with Supabase security/performance advisors.

Official design references:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/database/secure-data

## 3. Schema boundaries

### `public`

Application data that may be reached through the Supabase Data API after explicit grants and RLS.

### `private`

Non-exposed helper functions and internal authorization helpers. No direct browser Data API surface.

### Supabase-managed schemas

`auth` and `storage` remain Supabase-managed. ABHIDEA references them where required but does not redesign them.

## 4. Draft/live separation decision

A mutable editor row and a public live article must not be the same readable row.

V1 therefore separates:

- stable content identity
- stable localization identity
- mutable draft
- immutable editorial revisions
- current published snapshot

Flow:

`contents`
→ `content_localizations`
→ `content_drafts` (mutable)
→ publish transaction
→ `content_revisions` (immutable snapshot)
→ `published_localizations` (current public snapshot)

This is intentional duplication at the publication boundary. It prevents RLS from accidentally exposing draft-only columns and allows a live article to remain unchanged while a new revision is edited.

## 5. Canonical document contract

Article body data uses the ABHIDEA structured document format, not uncontrolled raw HTML.

Stored documents contain at minimum:

```json
{
  "schemaVersion": 1,
  "blocks": []
}
```

Application validation must reject or safely isolate malformed/unknown executable content. Unknown presentation blocks must not crash the full Reader and must never execute arbitrary script/HTML.

## 6. Core tables

### 6.1 `admin_members`

Purpose: server-controlled ABHIDEA Studio authorization.

Key columns:

- `user_id uuid primary key references auth.users(id)`
- `display_name text`
- `role text check (role in ('owner','admin'))`
- `is_active boolean default true`
- `invited_by uuid null references auth.users(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

Rules:

- V1 supports Owner and Admin only.
- maximum one active Owner enforced with a partial unique index
- no self-promotion from Admin to Owner
- owner bootstrap is an explicit controlled operation after an Auth user exists
- role authorization does not come from `raw_user_meta_data`

### 6.2 `content_types`

Purpose: database-driven Content folders/types.

Key columns:

- `id uuid primary key`
- `name text unique`
- `slug text unique`
- `description text null`
- `icon_key text null`
- `is_active boolean default true`
- `public_explore_enabled boolean default true`
- `sort_order integer default 0`
- timestamps

Initial seed rows:

- Article
- Book Summary
- Fact
- Thought
- Idea
- Life Lesson
- Guide
- Video Insight

Types can be deactivated/reordered without code changes. Hard deletion is blocked while content references the type.

### 6.3 `contents`

Purpose: language-neutral conceptual content identity.

Key columns:

- `id uuid primary key default gen_random_uuid()`
- `content_type_id uuid references content_types(id)`
- `creator_id uuid references auth.users(id)`
- `lifecycle_status text check (lifecycle_status in ('active','trashed'))`
- `created_at`
- `updated_at`
- `trashed_at timestamptz null`
- `trashed_by uuid null references auth.users(id)`

The row exists before meaningful writing begins, giving every draft a stable identity.

### 6.4 `content_localizations`

Purpose: stable English/Hindi identity for one content item.

Key columns:

- `id uuid primary key`
- `content_id uuid references contents(id) on delete cascade`
- `locale text check (locale in ('en','hi'))`
- `created_at`
- `updated_at`

Constraint:

- unique `(content_id, locale)`

This table does not contain the public article body.

### 6.5 `content_drafts`

Purpose: mutable autosaved editor state.

Key columns:

- `localization_id uuid primary key references content_localizations(id) on delete cascade`
- `title text`
- `slug text`
- `summary text`
- `body_json jsonb`
- `seo_title text null`
- `seo_description text null`
- `review_state text check (review_state in ('draft','needs_review','ready'))`
- `editor_state jsonb default '{}'`
- `lock_version bigint default 1`
- `updated_by uuid references auth.users(id)`
- `autosaved_at timestamptz`
- `updated_at timestamptz`

Constraints/behavior:

- unique draft slug per locale where slug is non-empty
- `body_json` must be an object and carry a supported `schemaVersion`
- autosave increments `lock_version`
- update calls use expected `lock_version` for optimistic concurrency
- autosave does not create permanent revisions

### 6.6 `content_revisions`

Purpose: immutable editorial snapshots.

Key columns:

- `id uuid primary key`
- `localization_id uuid references content_localizations(id)`
- `revision_number bigint`
- `snapshot_json jsonb`
- `created_by uuid references auth.users(id)`
- `created_at timestamptz`
- `reason text null`

Constraint:

- unique `(localization_id, revision_number)`

Policy direction:

- Admins can read revision history
- publication workflow can insert revisions
- ordinary clients cannot update/delete revision rows

Snapshot contains all publishable localization fields required to reconstruct that revision.

### 6.7 `published_localizations`

Purpose: current public live snapshot.

Key columns:

- `localization_id uuid primary key references content_localizations(id)`
- `content_id uuid references contents(id)`
- `revision_id uuid unique references content_revisions(id)`
- `locale text check (locale in ('en','hi'))`
- `slug text`
- `title text`
- `summary text`
- `body_json jsonb`
- `seo_title text null`
- `seo_description text null`
- `sources_json jsonb default '[]'`
- `publication_state text check (publication_state in ('published','archived'))`
- `published_at timestamptz`
- `updated_at timestamptz`

Constraints:

- unique `(locale, slug)`
- public policy only permits `publication_state = 'published'`

The Reader and public search build from this live-safe layer, not from `content_drafts`.

Publish/republish updates this row atomically after a revision snapshot is created.

## 7. Taxonomy

Content Type and Subject remain separate dimensions.

### `subjects`
### `topics`
### `tags`

Each uses a compact controlled-vocabulary shape:

- `id uuid primary key`
- `name text`
- `slug text unique`
- `aliases text[] default '{}'`
- `is_active boolean default true`
- `sort_order integer default 0` where useful
- timestamps

Aliases can contain English, Hindi and Roman-Hindi/Hinglish search variants.

Relationship tables:

- `content_subjects(content_id, subject_id)`
- `content_topics(content_id, topic_id)`
- `content_tags(content_id, tag_id)`

Composite primary keys prevent duplicates.

Public relationship reads are allowed only when the linked content has at least one currently published localization.

Collections/Series are not created in the first migration unless Phase 1 scope is explicitly reopened for them.

## 8. Sources

### `sources`

Reusable public-safe source metadata:

- `id uuid primary key`
- `title text`
- `author_or_org text null`
- `url text`
- `source_type text null`
- `published_on date null`
- `accessed_on date null`
- `link_status text check (...)`
- `is_public boolean default false`
- timestamps

Do not store private admin notes in this table.

### `content_sources`

Draft/editor relationship:

- `localization_id`
- `source_id`
- `citation_label text null`
- `note text null`
- `sort_order integer`

This relationship is Admin-only while editing. Publish copies the safe ordered source representation into the live snapshot and marks referenced source records public as appropriate.

## 9. Media

### `media_assets`

Provider-neutral registry:

- `id uuid primary key`
- `provider text`
- `private_storage_key text null`
- `public_storage_key text null`
- `mime_type text`
- `width integer null`
- `height integer null`
- `byte_size bigint`
- `alt_text text null`
- `caption text null`
- `credit text null`
- `source_url text null`
- `media_kind text`
- `is_public boolean default false`
- `created_by uuid references auth.users(id)`
- timestamps

Content stores `mediaId`, never a permanent provider URL as its canonical media reference.

### `media_usages`

Tracks where an asset is used:

- `media_id`
- `content_id`
- `localization_id null`
- `usage_kind`
- timestamps

This supports where-used checks and safe deletion.

### Storage boundary

Planned V1 buckets:

- `media-private` — private Admin upload/staging area
- `media-public` — optimized assets approved for published delivery

Publishing can promote/copy the production variant. Original high-resolution archival files may remain in Drive rather than production Storage.

Storage object paths are not used as content identity.

## 10. Private learning notes

### `private_learning_notes`

- `id uuid primary key`
- `content_id uuid references contents(id)`
- `localization_id uuid null references content_localizations(id)`
- `body_json jsonb`
- `updated_by uuid references auth.users(id)`
- timestamps

Never granted to `anon`, never included in public search/sitemap/public snapshots.

## 11. Website control

### `site_settings`

Singleton public-safe website settings:

- brand name
- tagline
- default SEO metadata
- footer text/config
- selected navigation config
- timestamps

No secrets are stored here.

### `about_profile`

Singleton creator profile:

- public name
- Creator of ABHIDEA label
- education
- profession/background
- why ABHIDEA exists
- learning philosophy
- introduction/description
- two optional `media_assets` references
- timestamps

### `social_links`

Flexible records:

- `id`
- `label`
- `url`
- `icon_key null`
- `sort_order`
- `is_visible`
- timestamps

Anonymous users can only select visible rows, so blank/hidden URLs are not exposed.

### `homepage_modules`

Controlled module configuration, not a generic page builder:

- `id`
- `module_type`
- `config jsonb`
- `sort_order`
- `is_enabled`
- timestamps

Only application-supported module types are accepted. No arbitrary HTML/script configuration.

## 12. Redirects

### `redirects`

- `id uuid primary key`
- `old_path text unique`
- `new_path text`
- `status_code integer check (status_code in (301,308))`
- `is_active boolean`
- `created_by uuid`
- timestamps

Application validation prevents self-redirects and redirect loops.

## 13. Activity log

### `activity_log`

Append-only operational history:

- `id bigint generated always as identity primary key`
- `actor_id uuid null references auth.users(id)`
- `action text`
- `entity_type text`
- `entity_id uuid null`
- `metadata jsonb default '{}'`
- `created_at timestamptz`

Admins can read according to policy. Ordinary authenticated clients do not receive direct UPDATE/DELETE privileges. Writes come from trusted publication/admin workflows or controlled triggers.

## 14. Authorization helper

Planned helper:

`private.current_admin_role()`

Behavior:

- derives current caller from `auth.uid()`
- looks up an active `admin_members` row
- returns only `owner`, `admin` or null
- no caller-supplied user id
- `SECURITY DEFINER` only because it must safely inspect the authorization table without RLS recursion
- fixed/empty search path with fully-qualified object references
- lives in non-exposed `private` schema
- EXECUTE granted only as required to `authenticated`

Typical policy predicate:

```sql
(select private.current_admin_role()) in ('owner','admin')
```

Owner-only predicate:

```sql
(select private.current_admin_role()) = 'owner'
```

## 15. Public read model

Public ABHIDEA can read only intentionally public data:

- active Content Types
- live `published_localizations`
- content identities that have live editions
- active taxonomy values and published relationships
- public media metadata
- public source metadata
- public site settings
- About profile
- visible social links
- enabled homepage modules
- active redirects when routing needs them

Public ABHIDEA cannot read:

- drafts
- editor state
- revision history
- Trash-only content
- private learning notes
- Admin membership
- activity details
- unpublished source relationships
- private media metadata/storage objects

## 16. Publication transaction contract

A publish operation must behave as one editorial transaction:

1. verify authenticated active Admin role
2. validate expected draft `lock_version`
3. run publish preflight blockers
4. create immutable `content_revisions` snapshot
5. update/insert `published_localizations`
6. synchronize public-safe sources/media flags/representation
7. create redirect if a previously live slug changed
8. append activity entry
9. commit database transaction
10. only after DB commit, trigger application cache invalidation/public verification

External cache verification is not part of the database transaction and must be reported separately by Studio.

## 17. Delete / Trash contract

Moving content to Trash updates lifecycle metadata; it does not physically delete the editorial history immediately.

Permanent deletion is a separate Owner-restricted operation and must check dependencies such as:

- current live localizations
- revisions
- media usages
- relationships
- redirects

## 18. Index plan — initial

Indexes should follow actual access/RLS paths rather than blanket indexing.

Initial required indexes include:

- `admin_members(user_id)` via PK
- unique active Owner partial index
- `contents(content_type_id)`
- `contents(creator_id)`
- `contents(lifecycle_status)` where useful
- `content_localizations(content_id, locale)` unique
- `content_drafts(locale/slug equivalent via localization join strategy)` implemented through appropriate stored columns/constraint design during SQL drafting
- `content_revisions(localization_id, revision_number desc)`
- `published_localizations(locale, slug)` unique
- `published_localizations(content_id)`
- taxonomy relationship foreign-key indexes
- `media_usages(media_id)` and `media_usages(content_id)`
- `content_sources(localization_id)`
- `activity_log(created_at desc)`
- `redirects(old_path)` unique

Search-specific GIN/tsvector indexes are Phase 13 work and are not forced into the first schema merely for future speculation.

## 19. Explicitly deferred database objects

Do not create V1 tables now for:

- public user profiles/accounts
- followers/likes/comments
- public bookmarks/highlights
- semantic/vector embeddings
- RAG conversations
- quizzes/courses/LMS
- advanced Learning Paths
- newsletter infrastructure
- fake trending/popularity
- enterprise approval chains

## 20. Phase 3 implementation boundary

This document is a blueprint only.

No DDL, RLS policy, bucket, Auth user, seed row or Storage object is applied to the connected Supabase project until the Phase 3 RLS matrix and migration sequence are reviewed together and the security gate passes.
