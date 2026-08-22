# ABHIDEA Phase 10F — Private Draft Preview

## Scope

Phase 10F adds a protected Studio preview for saved localized drafts without publishing them and without creating a second rendering system.

## Delivered contract

- Preview route: `/studio/content/[localizationId]/preview`
- Route remains behind the existing protected Studio layout/session checks.
- Draft data is read with the current Studio access token and existing RLS.
- The saved `schemaVersion: 1` body is mapped into the existing `ReaderView` and `StructuredDocumentRenderer`.
- The public Reader remains fixture-backed in this phase.
- Preview metadata is `noindex, nofollow`.
- A persistent private-preview banner distinguishes the route from a live public page.
- Public Explore/share/related/source behavior is not invented for drafts.
- Existing bilingual counterpart drafts can switch directly between private previews.
- Unsupported or malformed stored bodies fail closed; no replacement content is fabricated.
- No database migration is required for this phase.

## Explicit non-goals

Phase 10F does not add publishing, revisions, public CMS delivery, autosave, media editing, SEO workflow, or public preview tokens.

## Verification gate

Before merge:

1. repository format, lint, typecheck, tests and production build must pass;
2. public Reader routes must keep their default behavior;
3. the preview route must remain Studio-auth protected;
4. the final staging build may be deployed to a Vercel preview URL for manual mobile/desktop inspection.
