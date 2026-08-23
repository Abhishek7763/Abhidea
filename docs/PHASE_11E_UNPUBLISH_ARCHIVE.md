# Phase 11E — Unpublish / Archive Lifecycle

## Goal
Allow a currently published localization to be removed from public Reader access without deleting its working draft or immutable revision history.

## Lifecycle
- Published → Archive: `published_localizations.publication_state` changes to `archived`.
- Archived rows remain available to authenticated Studio members but are hidden from public Reader RLS.
- The live revision ID and slug stay reserved so history remains coherent.
- Archived → Published: edit the private draft, mark it Ready, save it, and Publish again. The existing Phase 11B transaction creates a new immutable revision and sets the live snapshot back to `published`.

## Safety
- Archive RPC requires an authenticated active `admin` or `creator` Studio member.
- Caller must send the expected live revision ID. If the live revision changed, SQLSTATE `40001` blocks the stale archive.
- Archive is explicit and requires a confirmation checkbox in Studio.
- No revision rows are mutated or deleted.
- No draft content is mutated by archive.
- Public Reader needs no new permission: its existing RLS policy already exposes only `publication_state = 'published'`.

## Out of scope
Trash/restore, permanent delete, activity log, bulk archive, scheduling, and media remain later checkpoints.
