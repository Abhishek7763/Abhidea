# ABHIDEA Phase 11A — Publication Safety Foundation

## Scope

Phase 11A starts the Phase 11 editorial lifecycle without exposing a publish mutation yet.

It establishes the data boundary required by the approved Phase 3 blueprint:

`content_drafts` → future publish transaction → `content_revisions` → `published_localizations`

## Delivered contract

- `content_revisions` stores immutable, numbered localization snapshots.
- A trigger blocks ordinary revision UPDATE/DELETE even if privileges are accidentally broadened later.
- `published_localizations` stores the current live-safe snapshot separately from the mutable draft.
- `(locale, slug)` is unique for live snapshots.
- Live body JSON remains ABHIDEA `schemaVersion: 1` structured content.
- Public/anon can select only rows whose `publication_state` is `published`.
- Active Studio members can read publication/revision state for editorial work.
- No authenticated/anon INSERT, UPDATE or DELETE grant is added for revisions or live snapshots in this checkpoint.
- The Studio editor now shows a Publication Safety panel with Never Published / Published / Archived state.
- Saving a draft continues to affect only the private working draft.

## Explicit non-goals

Phase 11A does not add:

- Publish/republish button
- Preflight validation
- Scheduling
- Revision comparison UI
- Unpublish/archive mutation
- Trash/restore
- Activity log
- Public Reader database integration
- Media promotion

Those remain later controlled Phase 11+ checkpoints.

## Safety gate

Before merge:

1. rollback-only SQL verifies immutable revisions and read/write privileges;
2. repository format, lint, strict typecheck, tests and production build pass;
3. migration is applied once after code is frozen;
4. RLS/advisors are checked after DDL;
5. production `main` remains untouched.
