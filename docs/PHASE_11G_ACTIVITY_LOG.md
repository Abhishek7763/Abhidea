# Phase 11G — Studio Activity Log

## Goal
Provide a trustworthy, read-only timeline of important Studio content lifecycle actions without changing the existing publish workflow.

## Recorded events
- Draft created
- Draft saved
- Published
- Republished
- Archived
- Moved to Trash
- Restored

## Database safety
- `studio_activity_events` is append-only.
- `anon` receives no access.
- Authenticated clients receive SELECT only; active `admin` or `creator` membership is still required by RLS.
- Event INSERTs are produced by private database trigger functions, not browser code.
- UPDATE and DELETE are blocked by an immutable trigger.
- Publish/republish activity is sourced from immutable revision INSERTs.
- The internal Ready → Draft reset performed by publish is suppressed so it does not create a misleading duplicate Draft saved event.

## Historical backfill
The migration reconstructs events that are already durable and trustworthy:
- draft creation timestamps,
- all existing publish/republish revisions,
- current archived publication state,
- current Trash state.

Individual draft saves that happened before Phase 11G cannot be reconstructed accurately from the previous schema, so they are not invented. Every new save after this migration is recorded.

## Studio UI
`/studio/activity` shows up to the 200 most recent events with filters for:
- All activity
- Writing
- Publishing
- Lifecycle

The Activity page is available from both desktop and mobile Studio navigation.

## Out of scope
No publish UX redesign, analytics, permanent deletion, export, admin impersonation, scheduling, media, or AI work is included in this checkpoint.
