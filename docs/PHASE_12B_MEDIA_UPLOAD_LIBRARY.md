# ABHIDEA Phase 12B — Real Media Upload + Media Library

## Objective

Open the protected Studio Media workspace with a real private image upload flow while preserving the Phase 12A rule that draft media is never placed directly in a public bucket.

## Implemented flow

1. Studio validates filename, MIME, size and image signature.
2. A controlled RPC reserves a stable `media_assets.id` before bytes are accepted.
3. The server creates a Supabase signed upload ticket for the exact reserved private path.
4. The browser uploads the image directly to `media-private`; Vercel/Next does not proxy the file body.
5. A finalize RPC verifies that the reserved Storage object exists and records its actual Storage MIME/size.
6. The asset becomes `ready` in the protected Media Library.
7. Alt text, caption, credit and source URL remain editable through a controlled metadata RPC.

## Why direct-to-Storage

The file bytes use a signed Supabase upload URL, so the application server handles only small reservation/finalization messages. This keeps the 10 MiB bucket limit practical and avoids increasing Server Action request-body limits just to proxy image bytes.

## Safety

- No service-role/secret key is used in browser code.
- `media_assets` still has no direct browser INSERT/UPDATE/DELETE grant.
- Reservation/finalization helpers verify `auth.uid()` and active `admin|creator` Studio membership.
- Signed upload tickets are bound to `uploads/<user-id>/<media-id>/original.<ext>`.
- Finalization checks the exact reserved path and the real `storage.objects` metadata.
- Failed staged uploads may be deleted only through a narrow Storage DELETE policy while the asset is still unfinalized and unused.
- Public bucket writes remain unavailable from this workflow.
- Private previews use short-lived signed URLs generated for the authenticated Studio session.
- Metadata edits do not publish or promote the asset.

## Media Library UI

`/studio/media`

- private upload form
- JPEG / PNG / WebP / AVIF, maximum 10 MiB
- staged workflow status: checking → preparing → uploading → finalizing
- protected thumbnail grid
- filename / format / size / state
- stable link to asset detail

`/studio/media/<media-id>`

- protected private preview
- file facts
- alt text / caption / credit / source editor
- Where-used registry display

## Deferred to later Phase 12 checkpoints

- image optimization and dimension extraction
- public optimized variant promotion
- content editor Media picker / usage creation
- safe replacement
- dependency-checked asset retirement/deletion
- Source Library UI and content-source linking
- automated broken-link checks

## Gate

Phase 12B is accepted when Repository Verify is green, the migration passes live readback/security tests, and a staging Preview exposes the new protected Media routes without changing production `main`.
