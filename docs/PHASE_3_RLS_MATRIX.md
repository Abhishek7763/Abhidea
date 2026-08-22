# ABHIDEA Phase 3 — RLS / Grants Matrix

Status: Normalized after security review — NOT applied
Date: 2026-08-22

## Principals

- `anon`: unauthenticated public Reader/Search/Explore
- `authenticated` non-Admin: authenticated but no Studio authority
- Admin: `authenticated` plus active `admin_members` role `owner|admin`
- Owner: active `admin_members.role='owner'`
- `service_role`: trusted server/maintenance only, never browser-exposed

Admin predicate:

```sql
(select private.current_admin_role()) in ('owner','admin')
```

Owner predicate:

```sql
(select private.current_admin_role()) = 'owner'
```

## Default privilege posture

The first migration opts into explicit exposure:

```sql
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from public;
```

Required grants are then added explicitly. RLS is enabled on every exposed table.

## Public/Studio matrix

Legend: PUBLIC = safe row filter; ADMIN = active Admin; OWNER = active Owner; WORKFLOW = controlled server/RPC operation; NONE = no direct permission.

| Table | anon SELECT | authenticated SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `admin_members` | NONE | self; OWNER all | OWNER Admin-row only | OWNER Admin-row only | OWNER Admin-row only |
| `content_types` | PUBLIC safe dictionary | PUBLIC + ADMIN | ADMIN | ADMIN | NONE; deactivate |
| `contents` | NONE | ADMIN | ADMIN | ADMIN | NONE; controlled permanent delete only |
| `content_localizations` | NONE | ADMIN | ADMIN | ADMIN | NONE direct |
| `content_drafts` | NONE | ADMIN | ADMIN | ADMIN | ADMIN safe cleanup only |
| `content_revisions` | NONE | ADMIN | WORKFLOW/ADMIN actor-checked | NONE | NONE |
| `published_localizations` | published rows | published + ADMIN all | WORKFLOW | WORKFLOW | NONE; archive |
| `subjects` | PUBLIC safe dictionary | PUBLIC + ADMIN | ADMIN | ADMIN | NONE; deactivate |
| `topics` | PUBLIC safe dictionary | PUBLIC + ADMIN | ADMIN | ADMIN | NONE; deactivate |
| `tags` | PUBLIC safe dictionary | PUBLIC + ADMIN | ADMIN | ADMIN | NONE; deactivate |
| `content_subjects` | NONE | ADMIN | ADMIN | n/a | ADMIN |
| `content_topics` | NONE | ADMIN | ADMIN | n/a | ADMIN |
| `content_tags` | NONE | ADMIN | ADMIN | n/a | ADMIN |
| `sources` | NONE | ADMIN | ADMIN | ADMIN | NONE direct |
| `content_sources` | NONE | ADMIN | ADMIN | ADMIN | ADMIN |
| `media_assets` | PUBLIC only approved public key rows | PUBLIC + ADMIN | ADMIN/Media workflow | ADMIN/Media workflow | controlled Media workflow only |
| `media_usages` | NONE | ADMIN | ADMIN | ADMIN | ADMIN |
| `private_learning_notes` | NONE | ADMIN | ADMIN | ADMIN | ADMIN |
| `site_settings` | PUBLIC singleton | PUBLIC + ADMIN | bootstrap only | ADMIN | NONE |
| `about_profile` | PUBLIC singleton | PUBLIC + ADMIN | bootstrap/ADMIN | ADMIN | NONE |
| `social_links` | visible rows | visible + ADMIN all | ADMIN | ADMIN | ADMIN |
| `homepage_modules` | enabled rows | enabled + ADMIN all | ADMIN | ADMIN | ADMIN |
| `redirects` | active rows | active + ADMIN all | ADMIN/WORKFLOW | ADMIN/WORKFLOW | NONE; deactivate |
| `activity_log` | NONE | ADMIN | WORKFLOW only | NONE | NONE |

## Public predicates

### Live Reader snapshot

```sql
publication_state = 'published'
```

### Approved media metadata

```sql
public_storage_key is not null
```

### Social link

```sql
is_visible = true
```

### Homepage module

```sql
is_enabled = true
```

### Redirect

```sql
is_active = true
```

Content Type/Subject/Topic/Tag rows are controlled public-safe dictionaries. `is_active` and `public_explore_enabled` control creation/Explore, not secrecy, so old live snapshots do not break when a vocabulary item is deactivated.

## Working metadata privacy

There is deliberately no `anon` grant on:

- `contents`
- `content_localizations`
- `content_drafts`
- `content_revisions`
- working taxonomy relationships
- source library / working source relationships
- media usages/private media keys
- private learning notes
- Admin membership
- activity log

Public metadata comes from `published_localizations` snapshot fields:

- `content_type_id`
- `subjects_json`
- `topics_json`
- `tags_json`
- `sources_json`

Therefore editing a live article's type/taxonomy/sources does not leak before republish.

## Actor checks

Direct Admin writes that contain actor columns must prevent attribution forgery.

Examples:

```sql
(select auth.uid()) = updated_by
```

for draft updates, and current caller for revision creation.

`contents.creator_id` is assigned from authenticated workflow context rather than trusted arbitrary client input.

## `admin_members` restrictions

### SELECT
- member can read own row
- Owner can list all

### INSERT
- Owner can add only `role='admin'`
- ordinary CRUD cannot create another Owner

### UPDATE/DELETE
- Owner can manage Admin rows
- current Owner row is not transferred/demoted/deleted through general membership CRUD
- future ownership transfer is a separate audited step-up operation

This prevents self-promotion and broad privilege escalation.

## Revision immutability

Browser roles receive no revision UPDATE/DELETE. Rollback copies a historical snapshot into new working state and later creates a new revision.

## Public snapshot write safety

`published_localizations` is public-readable but not freely client-writable. Publication is a controlled transaction that verifies Admin role, draft version, preflight state, snapshot metadata, revision creation, redirect behavior and activity logging.

## Trash safety

Trash is not a standalone `contents` UPDATE exposed to arbitrary client behavior. Controlled Trash must archive all live `published_localizations` for the content before success is reported.

## Function privilege rules

For each app function/RPC:

1. revoke default EXECUTE from `PUBLIC`
2. grant only required roles
3. prefer `SECURITY INVOKER`
4. if `SECURITY DEFINER` is necessary, use non-exposed `private`, safe search path, fully-qualified objects, caller verification and minimal output
5. advisor review after migration

`private.current_admin_role()` accepts no caller-selected identity and derives the caller from `auth.uid()`.

## Storage matrix

### `media-private` (private bucket)

| Operation | anon | non-Admin authenticated | Admin/workflow |
|---|---|---|---|
| read | deny | deny | allow |
| upload | deny | deny | allow |
| replace | deny | deny | controlled allow |
| delete | deny | deny | dependency-checked workflow |

Upload attribution path:

```text
uploads/<auth.uid()>/<asset-uuid>/<filename>
```

### `media-public` (public delivery bucket)

Only published/approved optimized variants are copied here.

| Operation | public | non-Admin authenticated | Admin/workflow |
|---|---|---|---|
| read | allow | allow | allow |
| upload | deny | deny | controlled allow |
| replace | deny | deny | controlled allow |
| delete | deny | deny | where-used checked workflow |

Draft uploads never go directly to the public bucket.

## Required RLS tests

### anon
- can read published English and Hindi snapshot
- cannot read drafts, working metadata, revisions, sources, notes, Admin data
- cannot read hidden links/private media metadata
- cannot write editorial data

### authenticated non-Admin
- gains no Studio authority just by being authenticated
- cannot mutate content or membership

### Admin
- can create stable identity/localization/draft
- can autosave with actor attribution
- can manage working taxonomy/sources/media
- can read revisions but cannot mutate history
- cannot create/promote an Owner

### Owner
- can add/deactivate Admin rows
- has ordinary Admin editorial authority
- permanent destructive operations remain dedicated workflows

## Gate

Before schema application:

- every required GRANT reviewed
- RLS enabled on exposed tables
- no accidental function EXECUTE
- no browser service secret
- helper function reviewed for safe `SECURITY DEFINER`
- repeatable denial/allow tests prepared
- migration sequence agrees with this matrix

After application, both Supabase security and performance advisors must be clean or every finding must be understood and resolved.
