# ABHIDEA Phase 3 — RLS / Grants Matrix

Status: Design only — NOT applied
Date: 2026-08-22

## 1. Access principals

### `anon`

Unauthenticated public Reader/Search/Explore traffic.

### `authenticated` non-Admin

No public user accounts are a V1 feature, but policies must remain safe if authenticated non-Admins exist later. Authentication alone does not grant Studio authority.

### active ABHIDEA Admin

`authenticated` user for whom:

```sql
(select private.current_admin_role()) in ('owner','admin')
```

### Owner

`authenticated` user for whom:

```sql
(select private.current_admin_role()) = 'owner'
```

### `service_role`

Trusted server/maintenance context only. Never browser-exposed. Explicit object grants remain deliberate even though service-role access bypasses RLS.

## 2. Default privilege posture

Before application tables are created, the migration will opt into explicit exposure rather than assuming historical Supabase defaults.

Direction:

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

Every required grant is then added explicitly in the same migration family as the relevant RLS policies.

## 3. Authorization helper rules

`private.current_admin_role()` is the only planned shared RLS helper for V1.

Security requirements:

- caller identity comes only from `auth.uid()`
- caller cannot pass a target user id
- reads only active `public.admin_members`
- function lives in non-exposed `private`
- fixed safe search path / fully-qualified names
- EXECUTE available only where RLS evaluation requires it
- no authorization decision uses `raw_user_meta_data`

Granting `USAGE` on `private` to `authenticated` for a specific helper does not make `private` a Data API exposed schema.

## 4. Core RLS matrix

Legend:

- PUBLIC = public-safe row filter
- ADMIN = active Owner/Admin only
- OWNER = active Owner only
- NONE = no direct grant/policy
- WORKFLOW = trusted controlled publication/system operation rather than arbitrary table DML

| Table | anon SELECT | authenticated SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `admin_members` | NONE | self row; Owner can list all | OWNER, Admin role rows only | OWNER, Admin role rows only | OWNER, Admin role rows only |
| `content_types` | active rows | active rows + ADMIN all | ADMIN | ADMIN | NONE; deactivate instead |
| `contents` | PUBLIC if a live localization exists | PUBLIC + ADMIN all | ADMIN | ADMIN | NONE; Trash/controlled permanent delete |
| `content_localizations` | NONE | ADMIN | ADMIN | ADMIN | NONE direct |
| `content_drafts` | NONE | ADMIN | ADMIN | ADMIN + expected version in application/RPC | ADMIN only when safe/editorial cleanup |
| `content_revisions` | NONE | ADMIN | WORKFLOW/ADMIN with actor check | NONE | NONE |
| `published_localizations` | published rows only | published rows + ADMIN all | WORKFLOW | WORKFLOW | NONE; archive/unpublish instead |
| `subjects` | active rows | active rows + ADMIN all | ADMIN | ADMIN | NONE; deactivate instead |
| `topics` | active rows | active rows + ADMIN all | ADMIN | ADMIN | NONE; deactivate instead |
| `tags` | active rows | active rows + ADMIN all | ADMIN | ADMIN | NONE; deactivate instead |
| `content_subjects` | PUBLIC published-content relationships | PUBLIC + ADMIN all | ADMIN | n/a | ADMIN |
| `content_topics` | PUBLIC published-content relationships | PUBLIC + ADMIN all | ADMIN | n/a | ADMIN |
| `content_tags` | PUBLIC published-content relationships | PUBLIC + ADMIN all | ADMIN | n/a | ADMIN |
| `sources` | `is_public = true` | public + ADMIN all | ADMIN | ADMIN | NONE direct |
| `content_sources` | NONE | ADMIN | ADMIN | ADMIN | ADMIN |
| `media_assets` | `is_public = true` | public + ADMIN all | ADMIN/Media Service | ADMIN/Media Service | NONE direct until safe dependency check |
| `media_usages` | NONE | ADMIN | ADMIN/Media Service | ADMIN/Media Service | ADMIN/Media Service |
| `private_learning_notes` | NONE | ADMIN | ADMIN | ADMIN | ADMIN |
| `site_settings` | public singleton | public + ADMIN | bootstrap only | ADMIN | NONE |
| `about_profile` | public singleton | public + ADMIN | bootstrap/ADMIN | ADMIN | NONE |
| `social_links` | `is_visible = true` | visible + ADMIN all | ADMIN | ADMIN | ADMIN |
| `homepage_modules` | `is_enabled = true` | enabled + ADMIN all | ADMIN | ADMIN | ADMIN |
| `redirects` | active rows | active + ADMIN all | ADMIN/WORKFLOW | ADMIN/WORKFLOW | NONE; deactivate instead |
| `activity_log` | NONE | ADMIN | WORKFLOW only | NONE | NONE |

## 5. Public row predicates

### Published content identity

Anonymous access to a `contents` row requires a live published edition:

```sql
exists (
  select 1
  from public.published_localizations p
  where p.content_id = contents.id
    and p.publication_state = 'published'
)
```

An index on `published_localizations(content_id, publication_state)` supports this predicate.

### Live localization

```sql
publication_state = 'published'
```

### Published taxonomy relationships

For `content_subjects`, `content_topics` and `content_tags`, anonymous access requires a linked `contents` row with at least one live publication.

### Public source

```sql
is_public = true
```

### Public media metadata

```sql
is_public = true
```

### Social links

```sql
is_visible = true
```

### Homepage modules

```sql
is_enabled = true
```

## 6. Admin predicate

Reusable policy direction:

```sql
create policy "active admins can ..."
on public.some_admin_table
for select
to authenticated
using ((select private.current_admin_role()) in ('owner','admin'));
```

For INSERT/UPDATE, use `WITH CHECK` as well.

Authentication alone is never sufficient:

```sql
-- NOT acceptable by itself
TO authenticated
USING (true)
```

for Studio/private data.

## 7. Actor attribution checks

Tables containing direct actor columns must not let an Admin forge another actor's identity through ordinary client DML.

Examples:

### Draft update

`content_drafts.updated_by` must equal current user when written directly:

```sql
(select auth.uid()) = updated_by
```

### Revision insert

`content_revisions.created_by` must equal current user for an authorized publication operation.

### Content creation

`contents.creator_id` is set to current caller by application/database workflow rather than trusted from arbitrary client input.

Activity logging uses trusted workflow context and is not directly writable by ordinary authenticated clients.

## 8. `admin_members` special restrictions

`admin_members` is security-critical and does not receive a generic Admin-all policy.

### SELECT

- each active member may read their own row
- Owner may read all membership rows

### INSERT

Owner may add a row only with:

```text
role = 'admin'
```

No ordinary table policy can create another Owner.

### UPDATE

Owner may modify Admin rows only. General table UPDATE cannot:

- promote Admin → Owner
- demote/replace the current Owner
- transfer ownership

Any future ownership-transfer operation must be a separate, strongly authenticated, audited workflow.

### DELETE / deactivate

Owner can deactivate/remove Admin membership. The Owner row is not deleted through ordinary Studio membership CRUD.

## 9. Draft safety

There is deliberately no `anon` GRANT on:

- `content_localizations`
- `content_drafts`
- `content_revisions`
- `content_sources`
- `media_usages`
- `private_learning_notes`
- `admin_members`
- `activity_log`

Therefore a missing/incorrect public row filter on these tables cannot become the only line of defense; the Data API grant layer blocks anonymous access first.

## 10. Revision immutability

`content_revisions` receives no ordinary UPDATE or DELETE permission for browser roles.

Rollback means:

1. read a prior revision
2. copy it into a new working draft/revision
3. publish a new revision

It does not mutate historical revision rows.

## 11. Public snapshot write safety

`published_localizations` is public-readable but not freely client-writable.

Publication writes occur through a controlled server/RPC transaction that:

- confirms active Admin role
- validates draft version
- creates revision
- writes live snapshot
- handles slug redirect
- records activity

Ordinary non-Admin authenticated users receive no write path.

## 12. Permanent delete safety

No general authenticated DELETE grant is planned for `contents`.

Trash is an UPDATE to lifecycle state.

Permanent delete, if enabled in V1, is a dedicated Owner-only operation with dependency checks. The same principle applies to destructive media cleanup.

## 13. Storage policy matrix

### Bucket: `media-private`

Bucket is private.

| Operation | anon | authenticated non-Admin | active Admin |
|---|---|---|---|
| SELECT/download | deny | deny | allow |
| INSERT/upload | deny | deny | allow |
| UPDATE/replace | deny | deny | allow through Media workflow |
| DELETE | deny | deny | allow only through safe Media workflow |

Upload paths should include the actor UUID for attribution, for example:

```text
uploads/<auth.uid()>/<asset-uuid>/<filename>
```

Admin Media Library may read shared Admin assets; folder ownership is attribution, not an isolation boundary between Admins.

### Bucket: `media-public`

Contains only approved/published optimized variants. Public delivery is intentional.

| Operation | public | authenticated non-Admin | active Admin/workflow |
|---|---|---|---|
| READ | allow | allow | allow |
| INSERT | deny | deny | allow controlled publish/media workflow |
| UPDATE | deny | deny | allow controlled workflow |
| DELETE | deny | deny | allow only after where-used checks |

Draft uploads are never written directly to this public bucket.

## 14. Function privilege rules

For every application function/RPC:

1. revoke default `EXECUTE` from `PUBLIC`
2. grant only required roles
3. prefer `SECURITY INVOKER`
4. if `SECURITY DEFINER` is genuinely required, keep it in `private`, fix search path, fully qualify objects, and verify caller identity inside the function
5. run security advisors after migration

## 15. Sequence / identity rules

If identity sequences become directly exposed through table operations, grant only the minimum sequence privileges required by the relevant role. UUID primary keys remain the default for domain entities; `activity_log` may use a bigint identity because it is internal and append-only.

## 16. RLS test cases required before gate

The migration test plan must prove all of these:

### Anonymous

- can read one published English edition
- can read one published Hindi edition
- cannot read draft body
- cannot read archived/unpublished live snapshot
- cannot read revision history
- cannot read private learning notes
- cannot read hidden social link
- cannot read private media metadata/object
- cannot write any editorial row

### Authenticated non-Admin

- receives no Studio data authority simply by being authenticated
- cannot insert/update/delete content
- cannot call Owner/Admin workflows

### Admin

- can create stable content/localization/draft
- can autosave own attributed draft updates
- can read revision history
- can manage taxonomy/media/sources according to policy
- cannot create/promote an Owner through ordinary membership CRUD
- cannot mutate immutable revisions

### Owner

- can add/deactivate Admin membership
- can manage all normal Admin content operations
- destructive operations still require the dedicated workflow, not broad table DELETE grants

### Service role

- works only in trusted server/test context
- is never required by browser code

## 17. Phase gate

RLS is not approved merely because SQL compiles.

Before applying the production schema:

- schema blueprint reviewed
- this matrix reviewed
- migration sequence reviewed
- generated SQL checked for every explicit GRANT
- RLS enabled on every exposed table
- no broad accidental `PUBLIC` function execute
- no browser secret/service key
- RLS tests prepared
- Supabase security advisor run after application
- Supabase performance advisor run after application

Until then, connected Supabase remains unchanged.
