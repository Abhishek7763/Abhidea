# Phase 11C — Published Reader Delivery

## Objective

Connect the public bilingual Reader routes to the safe live snapshot created by Phase 11B without exposing drafts or immutable revision history.

## Delivery contract

- `/en/read/<slug>` and `/hi/read/<slug>` resolve a `published_localizations` row first.
- Public database access uses only the Supabase publishable key and existing `anon` RLS.
- Rows must have `publication_state = 'published'`.
- Canonical Reader JSON is parsed fail-closed before rendering.
- Linked language switching only appears when the sibling localization also has a published live snapshot.
- Real published pages receive crawlable canonical/language metadata.
- Existing QA/demo fixtures remain a compatibility fallback and stay `noindex,nofollow`.

## Snapshot self-containment

`published_localizations` now stores `content_type_name` and `content_type_slug` alongside the existing content type ID. A private trigger stamps these values from `content_types` during publish/republish, so anonymous Reader delivery does not need access to private CMS tables or revision history.

## Security boundaries

- No service-role/secret key is used by Reader delivery.
- No public grant is added to `content_drafts` or `content_revisions`.
- Existing RLS remains the authority for anonymous live rows.
- The new trigger helper is `SECURITY INVOKER`, has an empty search path, and is not directly executable by `anon` or `authenticated`.

## Explicit non-goals

This checkpoint does not move Home, Explore or Search to Supabase. Those discovery surfaces remain separate later work. It also does not add Media/Sources, scheduling, archive/unpublish, Trash, revision compare/restore, or touch production `main`.

## Gate

A published English or Hindi slug can render through the real Reader from a public-safe live snapshot, while Draft and Revision records remain inaccessible to anonymous users.
