# ABHIDEA Phase 10D — Structured Editor Foundation

Status: Implementation checkpoint
Date: 2026-08-22
Baseline staging SHA: `ac2aa361bf556b8e9f138975d08d1bed7cd89fa8`
Supabase project: `zdsanovvmmwfiqjjnxhr`

## Purpose

Phase 10D turns saved private drafts into a real editable ABHIDEA structured-document workflow.

This checkpoint stays deliberately narrow:

- edit an existing localized draft
- edit title, slug and summary
- edit canonical `schemaVersion: 1` body blocks
- explicit Save Draft
- optimistic conflict protection through `lock_version`
- mobile-first block controls

It does not add autosave, publication, revisions, bilingual linking, media selection or public Reader integration.

## Route

`/studio/content/<localization-id>/edit`

The Content library now exposes a real `Edit draft` link only when a real draft row exists.

The route remains inside the existing protected Studio layout and uses the same HttpOnly Studio access token, Supabase publishable key and database RLS boundary as the rest of the CMS.

## Canonical editor contract

The editor writes ABHIDEA Reader JSON directly. Raw HTML is never canonical storage.

Phase 10D supports these Reader block types:

- Paragraph
- Heading 2 / Heading 3
- Quote
- Ordered / unordered List
- Callout (`note`, `key-idea`, `warning`)
- Divider
- Closure (`ABHIDEA's Take`, `Conclusion`)

The Reader already supports Figure blocks too, but Phase 10D intentionally does not expose Figure editing because the Media workflow is a later checkpoint.

If an existing draft contains Figure blocks, unknown blocks, malformed blocks or an unsupported schema version, Studio blocks saving instead of silently deleting or rewriting those blocks.

## Editor UX

The mobile-first editor provides:

- horizontal Add Block toolbar
- block numbering and type labels
- move up / move down
- delete block
- type-specific controls
- explicit sticky Save Draft bar
- visible current lock version
- saved-state confirmation after a successful reload

No fragile autosave is introduced yet. This follows the Phase 10 handoff requirement to establish explicit reliable saves before autosave.

## Conflict protection

`content_drafts.lock_version` already existed in the Phase 10A schema.

Phase 10D adds:

`public.update_content_draft(...)`

Migration:

`supabase/migrations/20260822220000_phase10d_update_draft_rpc.sql`

The RPC receives the lock version that was loaded with the editor.

The update succeeds only when:

`stored lock_version = expected lock_version`

A successful save increments `lock_version` by 1.

If another tab/device/process saved the draft first, the RPC raises PostgreSQL `40001`. The Studio Server Action converts that into a clear conflict message and does not overwrite the newer stored draft.

## Security

The update function is `SECURITY INVOKER`, never `SECURITY DEFINER`.

It therefore remains subject to:

- authenticated role grants
- existing `content_drafts` SELECT/UPDATE RLS
- active `studio_members` authorization
- `admin|creator` membership requirement

Function execution is revoked from `public` and `anon`, then granted only to `authenticated`.

No service-role or secret key is introduced.

## Server validation

The Server Action re-validates every mutation even though the form is already inside a protected route.

Checks include:

- valid localization UUID
- positive integer expected lock version
- title 1–180 characters
- Unicode-safe non-empty slug, maximum 180 characters
- summary maximum 1200 characters
- valid JSON
- supported `schemaVersion: 1`
- no ignored/malformed blocks
- maximum 300 blocks
- no Figure blocks in this editor checkpoint

The RPC repeats core identity/body bounds and restricts block type names for direct authenticated RPC calls.

## Data boundaries preserved

Phase 10D does not change:

- Content Type identity
- edition locale
- Subjects
- editorial status
- public Reader data source
- public URLs
- published content

Content Type / locale / status are displayed as read-only editor metadata.

## Verification gate

Before merge to `staging`:

1. repository format check passes
2. lint passes
3. strict typecheck passes
4. tests pass
5. production build passes
6. migration applies successfully
7. function readback confirms `SECURITY INVOKER`
8. `public` / `anon` cannot execute the update RPC
9. active Studio member rollback probe can update and increments `lock_version`
10. stale expected lock version is rejected with conflict code `40001`
11. rollback probe leaves zero permanent test rows
12. Supabase security/performance advisors are reviewed
13. `main` remains untouched

## Next checkpoint

Phase 10E — Bilingual Edition Linking.

English and Hindi editions will share the logical Content identity while keeping locale-specific title, summary, slug and body state independent.
