# ABHIDEA Phase 10C — Create Draft

Status: Phase 10C merged; post-merge RPC hardening verification complete — repository gate pending
Date: 2026-08-22
Original Phase 10C baseline: `32a9c2224f4247c1612b356a343cd39c0d138178`
Phase 10C staging merge: `0917d9e44a179cee5201b61210db93815497eef6`
Supabase project: `zdsanovvmmwfiqjjnxhr`

## Purpose

Phase 10C opens the first real private Studio authoring path on top of the Phase 10A schema and Phase 10B list without changing public Reader delivery.

The main Phase 10C workflow was merged to `staging` through PR #26. The follow-up work recorded here preserves that merged migration unchanged and adds a forward hardening migration so the repository matches the final live RPC definition verified after the interrupted/restarted execution.

## Studio flow

`/studio/content/new` provides:

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

Original merged migration:

- `supabase/migrations/20260822211500_phase10c_create_draft_rpc.sql`

Forward hardening migration:

- `supabase/migrations/20260822213000_phase10c_create_draft_rpc_hardening.sql`

The hardening migration uses `CREATE OR REPLACE FUNCTION`; it does not edit or remove the already-merged historical migration.

The RPC is:

- `public.create_content_draft(uuid,text,text,text,text,jsonb,uuid[])`

One RPC call creates, in one transaction:

- `contents`
- `content_localizations`
- `content_drafts`
- optional `content_subjects` rows

A failure at any point prevents a partial Content/Localization/Draft chain from being left behind.

## Hardening changes

The final live definition keeps the original `SECURITY INVOKER` model and tightens the server-side contract by:

- explicitly rejecting route-breaking slug whitespace and `/ ? #`
- de-duplicating Subject UUIDs before validation/insertion
- validating the de-duplicated Subject set against active Subjects
- keeping the Subject maximum at 12
- retaining explicit top-level `schemaVersion = 1` body validation
- preserving existing RLS as the authorization boundary
- retaining explicit function privilege revocation/grant statements

## Security model

Verified properties of the final live RPC:

- `SECURITY DEFINER`: false
- fixed empty `search_path`
- caller permissions and existing RLS remain authoritative
- `anon` EXECUTE: false
- `PUBLIC` EXECUTE: false
- `authenticated` EXECUTE: true
- active Content Type is required
- locale is limited to `en|hi`
- title, slug, summary and body shape are revalidated inside Postgres
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

This occurred across the interrupted/restarted Phase 10C execution. The first application activated the merged RPC and the later application used `CREATE OR REPLACE FUNCTION` to harden that same signature. Readback confirms exactly one live function object.

The generated history rows are intentionally not deleted or rewritten. The repository preserves the original merged migration and records the final live definition as a new forward hardening migration, which is safer than rewriting applied history.

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

Main Phase 10C:

1. Create Draft workflow merged through PR #26 — PASS
2. transactional RPC exists and security privileges are verified — PASS
3. active Studio member rollback creation succeeds — PASS
4. non-member creation is blocked — PASS
5. rollback probes leave no fake rows — PASS

Post-merge hardening:

1. original applied migration remains preserved — PASS
2. final live RPC is represented by a forward hardening migration — PASS
3. Repository Verify passes for the reconciliation PR — PENDING
4. merge to `staging` only after green CI — PENDING
5. production `main` remains untouched — PASS
