# ABHIDEA Phase 11B — Publish Preflight + Atomic Publish Transaction

## Scope

Phase 11B adds the first real Studio Publish action while keeping public Reader delivery fixture-backed.

A saved localized draft must be explicitly marked `Ready` before Publish becomes available. Publish always operates on the stored draft and its expected `lock_version`; unsaved browser edits are never silently included.

## Publish transaction

The database transaction:

1. verifies `auth.uid()` and active Studio `admin|creator` membership;
2. locks the draft row and verifies the expected lock version;
3. requires editorial state `ready`;
4. validates title, slug, summary and canonical Reader body structure;
5. rejects a live slug already owned by another localization in the same locale;
6. resolves shared Subjects into public-safe snapshot descriptors;
7. creates the next immutable `content_revisions` row;
8. inserts or replaces the matching `published_localizations` live snapshot;
9. resets the working draft to `draft` and increments its lock version;
10. commits all changes together or keeps none of them.

## Security boundary

Direct browser-role INSERT/UPDATE privileges are not granted on `content_revisions` or `published_localizations`.

The privileged mutation lives in `private.publish_content_draft_impl`, with a fixed empty search path and explicit caller authorization. The Data API entry point `public.publish_content_draft` remains `SECURITY INVOKER` and delegates only to that validated private transaction.

The private Reader-document validator accepts the current Studio-editable schemaVersion 1 blocks and rejects malformed, empty, duplicate-ID or unsupported blocks before publication.

## Studio UX

The editor can now save one of:

- Draft
- Needs review
- Ready

The Publication Safety panel shows the current live revision independently from the working draft. A separate Publish Preflight panel lists blockers. Once the saved draft passes local preflight, the explicit `Publish saved draft` action becomes available.

After a successful publish, the page reloads with the new live revision while the working draft returns to `Draft` with a new lock version.

## Deferred

This checkpoint does not switch public Reader/Search/Explore to Supabase live snapshots, add scheduling, archive/unpublish, redirects, revision comparison/restore, media promotion or cache invalidation. Those remain later Phase 11 checkpoints.
