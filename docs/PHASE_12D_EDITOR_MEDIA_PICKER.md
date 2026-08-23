# Phase 12D — Content Editor Media Picker + Where-used Linking

## Scope

This checkpoint connects the structured Studio editor to the private Media Library without making draft media public.

Implemented:

- Figure becomes an editable schemaVersion 1 block.
- Figure blocks use stable `mediaId` references already supported by the Reader schema.
- Media Library choices lazy-load only when requested.
- Only `ready` optimized private images with known dimensions are selectable.
- Alt text, caption and credit copy into the Figure block and remain editable per article edition.
- Saving a draft synchronizes `reader_figure` entries in `media_usages` in the same database transaction as the draft body update.
- Removing or changing a Figure updates where-used links on the next successful save.
- Multiple Figure blocks using the same Media asset create one edition-level dependency row.
- Original and optimized Storage objects remain private.

## Publication boundary

Phase 12D intentionally does not create a public Media URL or Storage object.

A Figure-containing draft can be saved as Draft or Needs review. The Studio UI blocks Save as Ready while Figure blocks are present, and the existing database publishability helper also continues to reject Figure documents. This prevents an article from going live before public media promotion/resolution exists.

Public Media promotion and Reader delivery belong to Phase 12E.

## Transaction safety

`public.update_content_draft(...)` remains `SECURITY INVOKER` and continues to rely on authenticated Studio RLS.

Inside the same transaction it:

1. validates the structured body,
2. validates every Figure Media ID and metadata,
3. requires the referenced image to be ready, private, optimized, and dimensioned,
4. updates the lock-versioned draft,
5. replaces only that localization's `reader_figure` usage rows,
6. inserts distinct current Figure dependencies.

If any step fails, the draft update and dependency changes roll back together.

## Deferred

- public Storage promotion
- public Reader Media resolver
- automatic publish-time Media promotion
- safe Media replacement/deletion workflow
- source library UI and link health checks
