# ABHIDEA Phase 12C — Private Media Optimization

## Objective

Add a practical, no-paid-API image optimization step to the protected Media workflow without leaking draft media into public Storage.

## Final privacy decision

Phase 12B intentionally kept uploaded originals private. During 12C design, Supabase's built-in Image Transformations were reviewed and rejected as a dependency because they are a paid-plan feature. More importantly, moving an unused/draft asset into `media-public` before content publication would weaken the rule that public users cannot read draft material.

Therefore Phase 12C stores **both** the original and optimized image in `media-private`.

`public_storage_key` remains untouched. Public promotion is deferred until content-side Media usage and publication can prove that a specific asset is actually needed by a live Reader revision.

## Workflow

1. Upload/finalize the original exactly as Phase 12B already does.
2. Decode the image in the authenticated editor's browser.
3. Preserve aspect ratio and cap the longest edge at 1920 pixels.
4. Encode a WebP copy at quality `0.82` using browser Canvas APIs.
5. Request a signed upload ticket for exactly `optimized/<media-id>/main.webp` in `media-private`.
6. Upload the WebP directly browser → Supabase Storage; Vercel does not proxy file bytes.
7. Finalize through a controlled RPC that verifies the exact Storage object is WebP and under the 10 MiB bucket limit.
8. Store optimized path, optimized byte size, width, height and optimization timestamp on the stable Media row.
9. Prefer the optimized private copy for Studio thumbnails/previews.

## Partial-failure behavior

The original private asset becomes durable before optimization begins.

If optimization fails:

- the original remains valid and reusable,
- the upload form redirects to the Media detail page instead of creating a duplicate asset,
- the detail page exposes a real **Retry optimization** action,
- an interrupted optimized upload can be retried against the same deterministic path,
- finalization remains the only step that marks the optimized identity on `media_assets`.

No delete/replace operation is introduced in this checkpoint.

## Security

- No service-role key is used.
- Browser file bytes use signed Storage tickets.
- New RPC wrappers are `SECURITY INVOKER`.
- Privileged implementations remain in `private`, use an empty search path, verify `auth.uid()` and active `admin|creator` membership.
- `anon` cannot execute optimization RPCs.
- The new Storage INSERT policy accepts only the deterministic private WebP path for a ready image that does not already have an optimized variant.
- No public-bucket write policy is added.
- No UPDATE/upsert policy is added for optimized variants, so replacement is deferred to the later dependency-safe replacement checkpoint.

## UI

`/studio/media`

- upload status includes optimization stages,
- successful upload reports original + optimized private copies,
- cards show `Web optimized` and optimized size when available.

`/studio/media/<media-id>`

- optimized private preview is preferred when available,
- original size, optimized size and dimensions are visible,
- public state remains `Private only` until a later publish integration,
- incomplete optimization exposes a real retry control.

## Deferred

- content editor Media picker and `media_usages` creation,
- promotion/copy of optimized assets to `media-public` only when publication needs them,
- safe replacement,
- dependency-checked retirement/deletion,
- Source Library UI/content-source linking.

## Gate

Phase 12C is accepted when Repository Verify is green, the migration passes live RLS/Storage readback and advisors, and one exact merged-SHA staging Preview exposes the updated Media routes while production `main` remains untouched.
