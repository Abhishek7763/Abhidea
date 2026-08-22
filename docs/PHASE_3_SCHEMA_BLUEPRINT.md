# ABHIDEA Phase 3 — Database / Security Blueprint

Status: Normalized after security review — NOT applied to Supabase
Date: 2026-08-22
Branch: `work/database-blueprint`
Supabase project: `zdsanovvmmwfiqjjnxhr`

## Objective

Design the V1 PostgreSQL/Auth/RLS/Storage model before production DDL. The connected Supabase project currently has zero ABHIDEA public tables and clean security/performance advisors.

Earlier Drive snapshots belong to a different Supabase project and are reference material only.

## Non-negotiable security rules

1. Explicit GRANTs and RLS are separate access layers and are both required.
2. No service-role/secret key in browser code.
3. `authenticated` does not mean ABHIDEA Admin.
4. Authorization never trusts user-editable `user_metadata`.
5. Draft/editor/private rows are never anonymously readable.
6. Working metadata is also private until publish.
7. Public Reader/Search/Explore consume a deliberate live snapshot.
8. Security-definer helpers, if required, stay in non-exposed `private`, have a fixed safe search path and minimal privileges.
9. Revisions are immutable.
10. Schema application is migration-backed and followed by advisor/readback tests.

Official references:
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/database/secure-data

## Schema boundaries

### `public`
Application tables that may be reachable through the Data API only after explicit grants and RLS.

### `private`
Non-exposed authorization/helper functions. It is not a public Data API schema.

### Supabase-managed
`auth` and `storage` remain provider-managed.

## Publication architecture

ABHIDEA separates stable identity, mutable work, immutable history and live output:

`contents`
→ `content_localizations`
→ `content_drafts`
→ publish transaction
→ `content_revisions`
→ `published_localizations`

Working concept metadata and working relationships remain Admin-only. A published row snapshots everything Public needs so editing a live article cannot change Public before republish.

## Canonical document format

Body JSON belongs to ABHIDEA, not an editor library:

```json
{
  "schemaVersion": 1,
  "blocks": []
}
```

Unknown/malformed blocks fail safely and never execute uncontrolled HTML/script.

# Core model

## `admin_members`

- `user_id uuid primary key references auth.users(id)`
- `display_name text`
- `role text check (role in ('owner','admin'))`
- `is_active boolean default true`
- `invited_by uuid null references auth.users(id)`
- timestamps

Rules:
- maximum one active Owner via partial unique index
- ordinary membership CRUD can manage Admin rows only
- no Admin self-promotion
- Owner transfer is a separate future audited/step-up operation
- owner bootstrap waits for a real Auth user

## `content_types`

- `id uuid primary key`
- `name text unique`
- `slug text unique`
- `description text null`
- `icon_key text null`
- `is_active boolean default true`
- `public_explore_enabled boolean default true`
- `sort_order integer default 0`
- timestamps

Initial rows: Article, Book Summary, Fact, Thought, Idea, Life Lesson, Guide, Video Insight.

Controlled vocabulary is public-safe metadata; deactivation hides it from creation/Explore but does not make historical references secret.

## `contents`

Language-neutral working identity, Admin-only:

- `id uuid primary key default gen_random_uuid()`
- `content_type_id uuid references content_types(id)`
- `creator_id uuid references auth.users(id)`
- `lifecycle_status text check (lifecycle_status in ('active','trashed'))`
- `trashed_at timestamptz null`
- `trashed_by uuid null references auth.users(id)`
- timestamps

Created immediately when New Content starts.

## `content_localizations`

Stable English/Hindi working identity, Admin-only:

- `id uuid primary key`
- `content_id uuid references contents(id) on delete cascade`
- `locale text check (locale in ('en','hi'))`
- timestamps
- unique `(content_id, locale)`

## `content_drafts`

Mutable autosaved working state, Admin-only:

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

Rules:
- autosave increments `lock_version`
- expected version is checked to prevent silent overwrite
- autosave does not create permanent revisions
- draft slug may temporarily conflict; preflight warns and publish enforces the real live uniqueness constraint

## `content_revisions`

Immutable Admin-only editorial snapshots:

- `id uuid primary key`
- `localization_id uuid references content_localizations(id)`
- `revision_number bigint`
- `snapshot_json jsonb`
- `created_by uuid references auth.users(id)`
- `created_at timestamptz`
- `reason text null`
- unique `(localization_id, revision_number)`

No ordinary browser-role UPDATE/DELETE.

Snapshot includes the full publishable localization state plus resolved working metadata used at that revision.

## `published_localizations`

Current live-safe Reader/Search/Explore snapshot:

- `localization_id uuid primary key references content_localizations(id)`
- `content_id uuid references contents(id)`
- `revision_id uuid unique references content_revisions(id)`
- `content_type_id uuid references content_types(id)`
- `locale text check (locale in ('en','hi'))`
- `slug text`
- `title text`
- `summary text`
- `body_json jsonb`
- `seo_title text null`
- `seo_description text null`
- `subjects_json jsonb default '[]'`
- `topics_json jsonb default '[]'`
- `tags_json jsonb default '[]'`
- `sources_json jsonb default '[]'`
- `publication_state text check (publication_state in ('published','archived'))`
- `published_at timestamptz`
- `updated_at timestamptz`
- unique `(locale, slug)`

Public policy permits only `publication_state='published'`.

The taxonomy/source JSON contains only public-safe resolved descriptors needed to preserve the exact live edition. Search-specific derived indexes/columns are introduced in Phase 13, not prematurely.

# Working taxonomy

## `subjects`, `topics`, `tags`

Each controlled vocabulary table has:

- `id uuid primary key`
- `name text`
- `slug text unique`
- `aliases text[] default '{}'`
- `is_active boolean default true`
- ordering/timestamps where useful

Aliases may contain English, Hindi and Roman-Hindi/Hinglish variants.

These dictionaries are public-safe to read. `is_active` controls creation/Explore behavior, not secrecy.

## Working relationships

Admin-only:

- `content_subjects(content_id, subject_id)`
- `content_topics(content_id, topic_id)`
- `content_tags(content_id, tag_id)`

Composite primary keys prevent duplicates.

At publish time, resolved public-safe values are copied into the live snapshot JSON. Working relationship changes never become public merely because another edition is already live.

# Sources

## `sources`

Admin-only reusable source library:

- `id uuid primary key`
- `title text`
- `author_or_org text null`
- `url text`
- `source_type text null`
- `published_on date null`
- `accessed_on date null`
- `link_status text`
- timestamps

## `content_sources`

Admin-only working relation:

- `localization_id`
- `source_id`
- `citation_label text null`
- `note text null`
- `sort_order integer`

Publish resolves the safe citation representation into `published_localizations.sources_json`. No public Source table/page is required in V1.

# Media

## `media_assets`

Provider-neutral Admin registry:

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
- `created_by uuid references auth.users(id)`
- timestamps

Content uses `mediaId`, not permanent provider URLs.

Anonymous media metadata resolution is allowed only when `public_storage_key is not null`.

## `media_usages`

Admin-only where-used registry:

- `media_id`
- `content_id`
- `localization_id null`
- `usage_kind`
- timestamps

## Storage

- `media-private`: private staged Admin uploads
- `media-public`: public published/approved optimized variants only

Never upload a never-published draft directly to the public bucket.

# Private learning notes

## `private_learning_notes`

- `id uuid primary key`
- `content_id uuid references contents(id)`
- `localization_id uuid null references content_localizations(id)`
- `body_json jsonb`
- `updated_by uuid references auth.users(id)`
- timestamps

Admin-only; never public Search/sitemap/Reader.

# Website control

## `site_settings`
Public-safe singleton brand/SEO/footer/navigation defaults. No secrets.

## `about_profile`
Public creator identity, education/background/mission/philosophy and two optional media references.

## `social_links`
Flexible records with `label`, `url`, optional `icon_key`, order and `is_visible`. Public only when visible.

## `homepage_modules`
Controlled known module types with JSON config/order/enable state. Not arbitrary HTML/page-builder code.

# Redirects

## `redirects`

- UUID id
- `old_path text unique`
- `new_path text`
- `status_code` 301/308
- `is_active`
- actor/timestamps

Application validation prevents self-redirects and loops.

# Activity

## `activity_log`

Append-only:

- bigint identity PK
- `actor_id`
- `action`
- `entity_type`
- `entity_id`
- `metadata jsonb`
- `created_at`

Admin-readable; ordinary clients do not directly UPDATE/DELETE or forge events.

# Authorization helper

`private.current_admin_role()`:

- derives caller only from `auth.uid()`
- returns active `owner`, `admin` or null
- takes no caller-selected user id
- narrowly scoped `SECURITY DEFINER` to avoid RLS recursion
- fixed safe search path / fully-qualified objects
- function privileges explicitly revoked/granted

RLS predicates:

```sql
(select private.current_admin_role()) in ('owner','admin')
```

Owner-only:

```sql
(select private.current_admin_role()) = 'owner'
```

# Public Data API surface

Public may read only:

- `published_localizations` where published
- public-safe Content Type dictionary
- public-safe Subject/Topic/Tag dictionaries
- `media_assets` rows with approved public storage keys
- site settings
- About profile
- visible social links
- enabled homepage modules
- active redirects when required

Public cannot read:

- `contents`
- `content_localizations`
- drafts/editor state
- revision history
- working taxonomy/source relationships
- source library
- Trash/private learning notes
- Admin membership/activity internals
- private media keys/usages

# Publish transaction contract

1. verify active Admin
2. validate expected `lock_version`
3. run hard preflight blockers
4. resolve Content Type/taxonomy/sources into public-safe snapshot values
5. create immutable revision
6. upsert live `published_localizations`
7. promote/resolve public media variants
8. create redirect if live slug changed
9. append activity
10. commit DB transaction
11. after DB commit, invalidate cache and verify public delivery separately

# Trash contract

Trash is a controlled transaction, not a bare row edit:

1. mark concept trashed
2. archive all live `published_localizations` for that content
3. append activity
4. invalidate public cache

Permanent delete is a separate Owner-restricted dependency-checked operation.

# Initial index direction

- authorization PK/indexes and unique active Owner
- content FKs
- unique `(content_id, locale)`
- revisions `(localization_id, revision_number desc)`
- unique published `(locale, slug)`
- `published_localizations(content_id, publication_state)`
- taxonomy/source/media relationship FK indexes
- redirects old path unique
- activity newest-first index

Search GIN/tsvector indexes belong to Phase 13 after real query design.

# Deferred objects

No V1 tables for public profiles/accounts, followers/likes/comments, synced bookmarks/highlights, vectors/RAG, quizzes/LMS, Learning Paths, newsletters, fake trending or enterprise approval chains.

# Phase boundary

This is a normalized blueprint only. No DDL/RLS/bucket/Auth mutation has been applied to the connected Supabase project by Phase 3 design work yet.
