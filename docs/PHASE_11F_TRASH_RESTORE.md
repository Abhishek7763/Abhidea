# Phase 11F — Trash / Restore

## Goal
Add a reversible Trash lifecycle for one localized edition without deleting its draft, publication snapshot, bilingual content identity, or immutable revision history.

## Lifecycle
- Active → Trash: localization becomes `trashed`.
- If the edition is currently published, the same transaction first changes its publication snapshot to `archived`.
- Trashed editions leave the normal Content library and become read-only.
- Trash → Restore: localization becomes `active` again and returns to the private Content library.
- Restore never republishes an archived Reader page. Publishing remains a separate explicit action.

## Safety
- Trash and Restore require an authenticated active Studio `admin` or `creator`.
- Both actions verify the expected draft lock version.
- Trash also verifies the expected publication revision when a publication snapshot exists.
- Direct authenticated table updates to `content_localizations` are revoked so lifecycle transitions cannot bypass the archive transaction.
- Database triggers block draft mutation and publication activation while an edition is trashed.
- Public Reader permissions remain unchanged: archived snapshots are already hidden by published-only RLS.
- No DELETE is used for drafts, revisions, localizations, or publication snapshots.

## Studio behavior
- Active content list excludes Trash.
- `/studio/content/trash` lists trashed localized editions and provides Restore.
- Direct edit/preview loaders only return active editions.
- A trashed bilingual counterpart is shown as `in Trash` instead of offering a duplicate edition.

## Out of scope
Permanent deletion, retention expiry, bulk Trash, activity log, and Publish UX redesign remain later checkpoints.
