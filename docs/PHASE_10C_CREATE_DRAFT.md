# ABHIDEA Phase 10C — Create Draft

Status: Database verification complete — repository gate pending
Date: 2026-08-22
Baseline staging SHA: `32a9c2224f4247c1612b356a343cd39c0d138178`
Supabase project: `zdsanovvmmwfiqjjnxhr`

## Purpose

Open the first real private Studio authoring path on top of the Phase 10A schema and Phase 10B list without changing public Reader delivery.

Phase 10C creates one localized draft atomically and then returns to the Content library. It does not publish, schedule, create revisions, or replace the public fixture/catalog path.

## Studio flow

`/studio/content/new` now provides:

1. active Content Type selection
2. language selection: English or Hindi
3. title
4. optional manual slug with Unicode-safe title fallback
5. summary
6. optional active Subjects
7. starter body text converted to canonical structured paragraph blocks
8. Save Draft

The Content library exposes a real `New draft` entry point and displays a success notice after creation.

## Canonical body

Starter text is converted before persistence to the existing Reader-compatible shape:

```json
{
  "schemaVersion": 1,
  "blocks": [
    {
      "id": "paragraph-1",
      "type": "paragraph",
      "text": "..."
    }
  ]
}
```

Blank-line-separated text becomes paragraph blocks. Raw HTML is not used as the canonical document format.

## Slug behavior

Slug normalization:

- uses the entered slug when present
- otherwise derives from the title
- normalizes Unicode with NFKC
- preserves Unicode letters, numbers and combining marks, including Devanagari
- converts route-breaking punctuation/spacing to hyphens
- collapses duplicate hyphens
- caps the result at 180 characters

Draft slug uniqueness is still intentionally deferred to publication preflight.

## Transactional database write

Repository migration:

- `supabase/migrations/20260822210000_phase10c_create_draft_rpc.sql`

The migration adds one RPC:

- `public.create_content_draft(uuid,text,text,text,text,jsonb,uuid[])`

The RPC creates, in one transaction:

- `contents`
- `content_localizations`
- `content_drafts`
- optional `content_subjects` rows

A failure at any point prevents a partial Content/Localization/Draft chain from being left behind.

## Security model

The RPC is deliberately `SECURITY INVOKER`, not `SECURITY DEFINER`.

Verified properties:

- fixed empty `search_path`
- caller permissions and existing RLS remain authoritative
- `anon` EXECUTE: false
- `PUBLIC` EXECUTE: false
- `authenticated` EXECUTE: true
- active Content Type is required
- locale is limited to `en|hi`
- title, slug, summary and body shape are revalidated inside Postgres
- Subject IDs are de-duplicated, limited to 12 and must resolve to active Subjects
- actor attribution continues through the existing Phase 10A audit triggers
- no service-role key is used by Studio

Current Supabase guidance recommends `SECURITY INVOKER` for database functions and explicit function privileges; Phase 10C follows that model.

## Database verification — 2026-08-22

Verified against project `zdsanovvmmwfiqjjnxhr`:

- direct RPC return probe produced one `content_id` and one `localization_id`
- permanent-function rollback probe returned one row
- draft status was `draft`
- Content, Localization and Draft actor attribution matched the active Studio admin
- Hindi locale persisted correctly in the rollback probe
- body retained `schemaVersion = 1`
- authenticated non-member simulation was blocked from creating a draft
- rollback probes left `contents = 0`, `content_localizations = 0`, `content_drafts = 0`, `content_subjects = 0`
- exactly one live `create_content_draft(uuid,text,text,text,text,jsonb,uuid[])` function exists

Security Advisor still reports the previously known project-level warning **Leaked Password Protection Disabled**. No new Phase 10C database-function/RLS warning was introduced.

Performance Advisor reports only existing `unused_index` INFO notices on the new CMS tables. These indexes are retained because the CMS still has no real authoring rows and upcoming list/edit workflows are expected to use them.

## Migration-history bookkeeping

The connected Supabase migration history contains two generated entries named `phase10c_create_draft_rpc`:

- `20260822151459 phase10c_create_draft_rpc`
- `20260822153440 phase10c_create_draft_rpc`

This happened across the interrupted/restarted Phase 10C execution. The migration uses `CREATE OR REPLACE FUNCTION`, so the second application replaced the same function definition rather than creating a duplicate schema object. Readback confirms exactly one live function signature.

The history rows are intentionally not deleted or rewritten after the fact; destructive migration-history cleanup would create more risk than documenting the idempotent duplicate apply. The repository contains only the final migration definition.

## Deliberately out of Phase 10C

Not added here:

- edit existing draft route
- autosave
- optimistic lock conflict UI
- review-state controls
- create/edit Subjects
- publish/unpublish
- scheduling
- immutable revisions
- media picker
- AI drafting helper
- public Reader/Search/Explore CMS cutover

Those remain later checkpoints.

## Repository acceptance gate

Phase 10C is accepted only after:

1. transactional RPC exists and security privileges are verified — PASS
2. active Studio member rollback creation succeeds — PASS
3. non-member creation is blocked — PASS
4. rollback probes leave no fake rows — PASS
5. Repository Verify passes — PENDING
6. PR merges to `staging` only after green CI — PENDING
7. production `main` remains untouched — PASS
