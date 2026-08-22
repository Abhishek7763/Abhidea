# ABHIDEA Phase 3 — Security Review

Status: Review in progress; blocking findings identified and resolved in design
Date: 2026-08-22

## Scope reviewed

- schema blueprint
- draft/live separation
- public Data API surface
- Owner/Admin authorization
- RLS/grants approach
- revisions
- taxonomy/source/media relationships
- Storage boundary
- destructive actions
- current connected Supabase state
- current Supabase RLS/Data API guidance

## Current live Supabase evidence

At review time:

- `public` application tables: 0
- security advisor findings: 0
- performance advisor findings: 0
- installed relevant extensions: `pgcrypto`, `uuid-ossp`

No DDL has been applied by this Phase 3 work.

## Finding S1 — working metadata could leak before publish

Severity: HIGH

Initial blueprint direction allowed anonymous reading of `contents` and working taxonomy relationships when a content item already had a published edition.

That is unsafe for draft/live separation. Example:

1. Article A is published as an Article under Psychology.
2. Admin starts a revision and changes Content Type/Subject/Tags.
3. If working `contents` / relationship rows are public, those metadata edits become visible before the revision is published.

### Resolution

Working identity/metadata becomes Admin-only:

- `contents`: no anonymous access
- `content_localizations`: no anonymous access
- `content_drafts`: no anonymous access
- `content_subjects`: no anonymous access
- `content_topics`: no anonymous access
- `content_tags`: no anonymous access
- `content_sources`: no anonymous access

The live public snapshot becomes self-contained enough for Public ABHIDEA:

`published_localizations` additionally snapshots:

- `content_type_id`
- `subjects_json`
- `topics_json`
- `tags_json`
- `sources_json`

Each taxonomy JSON value contains only public-safe resolved identifiers/labels/slugs needed by Reader/Search/Explore.

This means changing working metadata does not affect Public until publication updates the live snapshot.

## Finding S2 — draft slug uniqueness was over-constrained

Severity: MEDIUM

The initial draft model suggested a unique draft slug per locale, but `content_drafts` does not independently own locale and a cross-table uniqueness rule would add unnecessary complexity.

### Resolution

- draft slug may temporarily conflict while editing
- Studio/preflight warns on conflicts
- publication transaction enforces the real invariant through `published_localizations unique(locale, slug)`
- public URLs remain protected at the live boundary

No redundant locale column is added to `content_drafts` solely for a draft-only uniqueness constraint.

## Finding S3 — public source records are unnecessary

Severity: MEDIUM

A public `sources.is_public` flag would create lifecycle cleanup questions after unpublish and could expose reusable source rows independently of a live article.

### Resolution

- `sources` remains Admin-only in V1
- working `content_sources` remains Admin-only
- publication copies public-safe citation/source data into `published_localizations.sources_json`
- Reader consumes the published snapshot

A future public Source page can introduce a separate explicit public model if real product need appears.

## Finding S4 — media draft/public boundary

Severity: HIGH

A single public Storage bucket would make a never-published draft upload directly reachable if its object URL leaked.

### Resolution

Use two delivery states:

- `media-private`: Admin-only staged upload/optimized working asset
- `media-public`: published/approved production variant only

`media_assets.public_storage_key` stays null until an asset is promoted for public use.

Anonymous metadata policy, if exposed, requires a non-null approved public key. Draft object paths are never written directly to the public bucket.

## Finding S5 — Admin role recursion / self-promotion

Severity: HIGH

Using RLS on `admin_members` while policies query `admin_members` directly can cause recursion, and broad authenticated membership writes could enable privilege escalation.

### Resolution

- `private.current_admin_role()` performs the minimal role lookup
- helper accepts no user-id argument
- helper derives caller from `auth.uid()`
- helper is in non-exposed `private`
- fixed search path and fully-qualified table reference
- EXECUTE privilege explicitly controlled
- ordinary membership CRUD may create/update/deactivate `admin` rows only
- current Owner row is not transferable through general CRUD
- future ownership transfer is a separate strongly authenticated audited operation

## Finding S6 — authenticated is not Admin

Severity: HIGH

`TO authenticated` alone would become unsafe if ABHIDEA later introduces public accounts or an Auth user exists without Studio membership.

### Resolution

Every Studio/private policy combines `TO authenticated` with the active Admin helper predicate.

## Finding S7 — service key temptation for publication

Severity: MEDIUM

Using a browser-triggered service-role client would bypass RLS and make policy mistakes harder to detect.

### Resolution

- no service/secret key in browser
- publication uses an authenticated server/RPC boundary
- prefer `SECURITY INVOKER`
- narrowly scoped `SECURITY DEFINER` only when a documented operation genuinely requires it
- RLS remains meaningful for Admin writes

## Finding S8 — historical revision mutation

Severity: HIGH

Allowing Admin UPDATE/DELETE on `content_revisions` would destroy audit/rollback integrity.

### Resolution

Browser roles receive no ordinary revision UPDATE/DELETE. Rollback creates a new working/revision state rather than rewriting history.

## Finding S9 — Trash could remain public if publication is not archived

Severity: HIGH

If `contents.lifecycle_status` changed to Trash but public reads depended only on a separate published snapshot, an incorrectly implemented Trash operation could leave the Reader live.

### Resolution

Trash is a controlled editorial transaction:

1. mark conceptual content trashed
2. archive all live `published_localizations` for that content
3. append activity
4. invalidate public cache

Public reads still rely exclusively on `publication_state='published'`, so the transaction must archive the live snapshot before reporting Trash success.

## Finding S10 — default Data API exposure assumptions

Severity: HIGH

Supabase Data API access depends on object privileges as well as RLS, and platform defaults are evolving toward explicit exposure.

### Resolution

- revoke default grants at migration foundation
- explicitly GRANT minimum table/function/sequence privileges
- enable RLS on all exposed tables
- test both missing-grant and RLS behavior
- never assume Dashboard/SQL-created objects have identical exposure defaults

## Finding S11 — inactive taxonomy/content type and existing live pages

Severity: LOW

If a taxonomy/type is deactivated for new Explore use, an old live snapshot may still refer to it.

### Resolution

Controlled vocabulary rows are public-safe metadata and may remain readable even when inactive. `is_active` / `public_explore_enabled` controls selection in creation/Explore, not secrecy.

Hard deletion of a referenced vocabulary row is restricted.

## Finding S12 — Storage delete cannot rely only on UI

Severity: MEDIUM

A UI where-used warning is not a security/consistency guarantee if broad object DELETE remains available.

### Resolution

Destructive media deletion is routed through a safe Media workflow that verifies references before DB/object deletion. Direct broad destructive access is minimized.

## Revised public Data API surface

Anonymous/public application access is limited to:

- `published_localizations` where published
- public-safe `content_types`
- public-safe taxonomy dictionaries (`subjects`, `topics`, `tags`)
- approved `media_assets` metadata with a public production key
- public site settings
- About profile
- visible social links
- enabled homepage modules
- active redirects if the routing implementation requires Data API lookup

Not public:

- `contents`
- `content_localizations`
- `content_drafts`
- `content_revisions`
- all working content/taxonomy/source relationships
- `sources`
- private learning notes
- Admin membership
- activity log
- private media usage/keys

## Security review result

The initial design had real metadata/publication-boundary issues. They are now explicitly resolved by the amendments above.

Before SQL migration files are authored/applied, the schema blueprint, RLS matrix and migration sequence must be normalized to these decisions. The security gate remains CLOSED until that normalization is committed and reviewed.
