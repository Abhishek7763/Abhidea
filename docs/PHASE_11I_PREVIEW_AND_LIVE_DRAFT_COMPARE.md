# Phase 11I — Preview Modes + Live/Draft Compare

## Objective

Close the final functional review gaps found by the Phase 11 audit without redesigning the Publish UX or changing database behavior.

The approved Master Plan requires preview support for Desktop, Mobile, Light, Dark, English and Hindi where available, plus a safe path to compare the current working Draft against the published version before republishing.

## Preview modes

The protected draft preview now provides explicit controls for:

- Desktop
- Mobile
- Light
- Dark
- English
- Hindi when an active linked edition exists

The responsive preview is rendered through a same-origin authenticated iframe. This is intentional: the iframe has its own real viewport, so Mobile mode triggers the Reader's actual responsive media queries instead of merely placing desktop CSS inside a narrow decorative box.

The iframe route independently validates the Studio session and remains `noindex`.

## Live vs Draft comparison

`/studio/content/[localizationId]/compare` is a read-only review route.

It resolves the immutable revision currently referenced by `published_localizations` and compares that baseline with the current saved draft. If the edition is archived, the preserved last-published revision is used as the baseline.

Current V1 comparison covers fields that exist and are editable at this checkpoint:

- title
- slug
- summary
- structured Reader blocks by stable block ID

It reports added, removed, changed and unchanged block counts.

Content-level Subjects are shared across language editions and are not editable in the current edition editor, so this checkpoint does not invent Subject changes. Media and Sources are intentionally deferred to Phase 12 and therefore are not fabricated in this comparison.

## Safety

- no database migration
- no new write RPC
- no Publish transaction changes
- no Archive/Trash/Restore changes
- compare route performs no mutation
- malformed draft bodies fail closed instead of producing a misleading diff
- public live content remains untouched while Draft review occurs
- Phase 11H public Reader verification remains preserved on the latest staging base

## Phase 11 audit impact

After this checkpoint, the Master Plan's Phase 11 functional list is covered:

- preview
- device/theme/language preview
- draft/live separation
- revisions
- revision history comparison
- Live vs Draft comparison
- preflight
- atomic publish
- partial failure handling
- public verification before green success where practical
- unpublish/archive
- Trash/restore
- activity log

The remaining Publish UI confusion is a usability/polish issue, not a missing publication-safety primitive. It should be simplified only after this functional checkpoint is verified.
