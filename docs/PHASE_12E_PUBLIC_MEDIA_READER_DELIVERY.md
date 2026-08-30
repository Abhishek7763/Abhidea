# ABHIDEA Phase 12E — Public Media Promotion + Reader Delivery

## Objective

Allow optimized Figure images from private Studio drafts to become public only as part of an explicit publish flow, while keeping the public Reader independent from private media tables and private Storage URLs.

## Publish flow

1. A Figure remains backed by `media-private` while the edition is Draft, Needs review, or saved Ready.
2. The explicit Publish action asks a controlled RPC for the exact Figure assets referenced by the saved draft lock version.
3. Only `ready` image assets with a finalized optimized WebP and dimensions are eligible.
4. The application copies the optimized private object to the deterministic public path `media-public/reader/<media-id>/main.webp` using the authenticated Studio session.
5. A finalize RPC verifies the real public Storage object, MIME type and size before recording `media_assets.public_storage_key`.
6. The atomic content publish transaction refuses any Figure whose public object is not verified.
7. The immutable revision and `published_localizations` snapshot receive a compact media manifest containing only media ID, public Storage key and dimensions.
8. The public Reader builds its image URL from that manifest and never queries `media_assets` or `media-private`.

## Safety boundaries

- Saving a draft or saving Ready does not copy bytes to public Storage.
- Public promotion happens only from the explicit Publish workflow.
- No service-role or secret key is sent to the browser.
- Public Storage INSERT is limited to active `admin|creator` Studio sessions, exact `reader/<media-id>/main.webp` paths, ready optimized image assets, and assets already linked through `reader_figure` usage.
- Finalization checks the actual `storage.objects` row and requires WebP with a maximum 10 MiB object size.
- Publish remains atomic for revision + live snapshot; if promotion is incomplete, the database publish preflight fails before creating a revision.
- The public snapshot is self-contained through `media_json`; private media metadata remains protected by RLS.
- Existing non-Figure Reader content keeps working with an empty media manifest.

## Reader delivery

- `published_localizations.media_json` is public-snapshot data, not a private media-table exposure.
- Figure blocks must have a matching manifest entry before a published row is accepted by the Reader parser.
- Next Image remote access is restricted to the configured Supabase `media-public` Reader path.
- Fixture/demo media keeps its existing local resolver fallback.

## Deferred

- public variant replacement/versioning after an already-public asset changes
- dependency-checked retirement/deletion and public-object garbage collection
- richer responsive variants / srcset generation
- Source Library UI and source-link health automation

## Gate

Phase 12E is accepted when repository Verify is green, the migration passes live schema/security readback, Supabase advisors show no new blocking issue, and the staging Vercel Preview loads successfully without changing production `main`.
