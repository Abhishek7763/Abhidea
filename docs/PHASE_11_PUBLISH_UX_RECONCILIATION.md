# ABHIDEA Phase 11 Publish UX Reconciliation

## Objective

Make the already-safe Phase 11 publish transaction understandable and practical on mobile without weakening the Draft → Ready → Publish safety boundary.

## Problem found in live audit

Recent Studio requests were succeeding, but the inspected drafts remained in `editorial_status = 'draft'` with no live revision. The publish backend was therefore not being reached. The workflow existed technically, but the Ready gate was too easy to miss in the editor.

## Delivered UX

- A prominent Publish workflow panel shows the current path: Draft → Mark Ready → Save Ready → Publish → View live.
- The editor keeps Editorial state controlled and explains what each state means.
- A one-tap `Mark Ready` shortcut moves the local editor selection to Ready without publishing anything.
- When Ready is selected, the sticky save action becomes `Save as Ready` and explains that Publish unlocks only after reload.
- A saved Ready draft gets an explicit `Ready saved — Publish is unlocked` success notice with a jump link to Publish.
- Publish blockers have a direct `Fix in Draft details` action.
- Successful publish gets a `View live Reader` action built from the actual published locale + slug.
- Existing Preview, immutable revisions, lock-version protection and atomic publish behavior remain unchanged.

## Security and safety boundary

This checkpoint adds no database migration and grants no new permissions.

- Save remains private.
- Ready remains a saved editorial state, not a publication event.
- Publish remains a separate explicit server action.
- Unsaved browser edits are still excluded from Publish.
- The existing database transaction continues to own authorization, stale-lock rejection, revision creation and live-snapshot replacement.

## Explicit non-goals

This checkpoint does not add Unpublish/Archive, Trash/Restore, activity log, scheduling, autosave, media, AI assistance or production `main` promotion.

## Gate

A mobile Studio user can clearly understand and execute Draft → Ready → Save → Publish → View live without guessing where Publish is hidden or accidentally publishing while saving.
