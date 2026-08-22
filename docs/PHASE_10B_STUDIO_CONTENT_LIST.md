# ABHIDEA Phase 10B — Studio Content List

Status: Implementation checkpoint
Date: 2026-08-22
Baseline staging SHA: `21b7785ac0a80edc01859162dad811aca459706b`

## Scope

Replace the protected `/studio/content` placeholder with the first real Supabase-backed CMS read experience.

## Implemented

- Server Component content list using the existing HttpOnly Studio access token.
- Supabase REST requests use only the project publishable key plus the authenticated bearer token; no service-role key is introduced.
- Database RLS remains the authorization boundary for CMS reads.
- Real filters for Content Type, editorial status and language using URL query parameters.
- Mobile-first list presentation with honest zero-data and zero-match states.
- Route-local loading and error boundaries around the real CMS data fetch.
- Real count handling with an explicit first-window notice if the list ever exceeds the initial 500 most recently updated drafts.
- No create/edit/publish links are exposed before those routes exist.

## Data source

Phase 10B reads the Phase 10A tables:

- `content_types`
- `content_drafts`
- `content_localizations`
- `contents`

The draft query embeds the existing foreign-key relationships so each list row resolves its logical content identity, localized edition and Content Type under the caller's RLS permissions.

## Guardrails preserved

- Public Reader delivery remains unchanged.
- `src/features/website/site-content.ts` remains temporary public discovery scaffolding for now.
- No CMS data becomes anonymously readable.
- No database DDL is added in Phase 10B.
- No autosave, create, edit, publish, schedule, media or revision workflow is activated.
- Production `main` is not changed by this checkpoint.

## Next boundary

Phase 10C adds the New Content flow and explicit Save Draft behavior. Until then, the list is intentionally read-only and an empty CMS shows an honest ready-state rather than fake rows or metrics.
