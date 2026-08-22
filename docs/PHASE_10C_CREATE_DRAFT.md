# ABHIDEA Phase 10C — Create Draft

Status: Implementation checkpoint
Date: 2026-08-22
Baseline staging SHA: `32a9c2224f4247c1612b356a343cd39c0d138178`
Supabase project: `zdsanovvmmwfiqjjnxhr`

## Purpose

Open the first real Studio authoring write path while preserving the Phase 10A data model, Phase 9 authorization boundary and fixture-backed public Reader.

Phase 10C creates only private working state. It does not publish, schedule, revise, autosave or change public content.

## Studio route

`/studio/content/new`

The mobile-first form includes:

1. active Content Type
2. language (`en` or `hi`)
3. title
4. optional manual slug, with Unicode-safe derivation from title when blank
5. summary
6. optional active Subjects (maximum 12 in this checkpoint)
7. starter body text
8. Save Draft

## Structured body

The starter body textarea is deliberately not stored as raw HTML.

Paragraphs separated by blank lines are converted server-side into the existing Reader contract:

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

This is intentionally a narrow authoring surface. Rich block editing belongs to a later checkpoint and must continue to use the same canonical document schema.

## Transactional create RPC

Migration:

`supabase/migrations/20260822211500_phase10c_create_draft_rpc.sql`

RPC:

`public.create_content_draft(...)`

One call creates:

- `contents`
- `content_localizations`
- `content_drafts`
- zero or more `content_subjects`

The function is `SECURITY INVOKER`, not `SECURITY DEFINER`.

Therefore the authenticated caller still needs the existing table grants and must pass the Phase 10A RLS policies. The function cannot bypass Studio membership authorization.

Function execution is explicitly revoked from `public` and `anon`, then granted only to `authenticated`.

## Validation

Both the Server Action and RPC enforce bounded input.

Key checks:

- valid UUID Content Type
- locale is `en|hi`
- title 1–180 characters
- non-empty normalized slug, maximum 180 characters
- summary maximum 1200 characters
- canonical body top-level shape
- maximum 12 selected Subjects
- selected Content Type must still be active
- selected Subjects must still be active

Database constraints remain the final canonical guardrail.

## Slug behavior

If the slug field is blank, Studio derives it from the title.

Normalization:

- Unicode NFKC
- lowercase where applicable
- keeps Unicode letters, numbers and combining marks
- collapses separators to `-`
- strips route-breaking punctuation
- maximum 180 characters

This supports English, Roman Hindi and Devanagari-safe working slugs.

Draft slugs remain intentionally non-unique. Final `(locale, slug)` uniqueness stays a publication-preflight responsibility.

## UX behavior

- Save uses a React Server Action.
- Pending state disables the Save button.
- Validation errors stay on the create screen.
- Successful save redirects to `/studio/content?created=1`.
- The Content list shows a confirmation notice and the real new draft.
- Empty Content library now links to Create First Draft.
- No Edit link is introduced yet because editing is the next checkpoint.

## Security boundaries

Phase 10C does not introduce:

- service-role/secret browser keys
- anonymous CMS writes
- `SECURITY DEFINER`
- public Reader reads from draft tables
- publish/schedule operations
- revisions
- media upload
- autosave

## Verification gate

Before merge to `staging`:

1. rollback-only transactional RPC probe succeeds
2. probe leaves zero permanent rows
3. migration applies successfully
4. active Studio admin can create through the RPC under authenticated RLS
5. authenticated non-member cannot create
6. security/performance advisors are reviewed
7. repository format/lint/typecheck/tests/build pass
8. `main` remains untouched
