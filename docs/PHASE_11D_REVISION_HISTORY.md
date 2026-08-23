# ABHIDEA Phase 11D — Revision History + Compare

## Objective

Expose the immutable publication history already created by Phase 11A/11B as a safe, read-only Studio workflow.

## Delivered contract

- The editor loads the latest immutable `content_revisions` for its localization using the existing Studio access token, publishable key and authenticated RLS.
- Revision history is ordered newest first and capped at 100 rows per editor load.
- Each revision shows its number, first-publish/republish reason, timestamp, saved title/slug and a Live badge when it owns the current published snapshot.
- `Review revision` opens a protected Studio route at `/studio/content/<localizationId>/revisions/<revisionId>`.
- The selected revision is compared with the immediately previous numbered revision when one exists.
- Compare reports Title, Slug and Summary changes, Subject additions/removals, and structured body blocks added/removed/changed by stable block ID.
- Revision snapshot parsing is fail-closed for unsupported schema, duplicate/unsafe block IDs, unsupported block types or malformed snapshot metadata.
- Revision 1 is treated as the baseline and clearly states that there is no earlier immutable snapshot.

## Security boundary

No schema or RLS change is required for this checkpoint.

`content_revisions` remains:

- unreadable to `anon`;
- SELECT-only for authenticated active Studio `admin|creator` members through existing RLS;
- immutable through the existing mutation-blocking trigger;
- unreachable through service-role/secret credentials in application code.

## Explicit non-goals

Phase 11D does not add restore, delete revision, unpublish/archive, Trash/restore, activity log, scheduling or public revision access.

Those remain later controlled Phase 11 checkpoints.

## Gate

A Studio member can review and compare publication revisions without any action that can mutate Draft, Revision or Live state. Existing Reader, publish transaction and public delivery behavior remain unchanged.
