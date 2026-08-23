# Phase 11H — Truthful Publish Verification

## Objective

Close the Phase 11 publish-success gap without redesigning the Studio publish UI.

A successful database transaction is necessary but is not by itself enough to show the final green "Published successfully" state. After the atomic publish transaction commits, Studio now verifies that the exact new revision is visible through the same anonymous, published-only boundary used by the public Reader and that the row still passes the canonical Reader parser.

## Flow

1. Run the existing atomic `publish_content_draft` transaction.
2. Preserve the returned immutable `revision_id`.
3. Revalidate Studio content paths.
4. Query `published_localizations` using the publishable/anonymous Reader credentials, filtered by:
   - `publication_state = published`
   - the exact localization
   - the exact new revision
5. Run the returned row through the canonical published Reader parser.
6. If verification succeeds, revalidate the exact public Reader path and redirect to the existing green success state.
7. If verification is unavailable or fails, do **not** report transaction failure and do **not** invite another publish. Return a warning state: the revision/live snapshot is safe, while public verification is pending.

## Safety properties

- No database migration.
- No service-role credential.
- Verification uses the public anonymous RLS path.
- Existing atomic publish transaction is unchanged.
- A post-commit verification problem never rolls back or mislabels a successful database publish as failed.
- Pending verification disables the publish button to reduce accidental duplicate republish attempts from the stale form.
- Green success remains the existing UI, but can now only be reached after public snapshot verification.

## Deferred

Explicit Desktop / Mobile / Light / Dark draft-preview controls remain the final Phase 11 functional gap and are intentionally not bundled into this checkpoint.
