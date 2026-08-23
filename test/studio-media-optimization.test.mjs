import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../supabase/migrations/20260823142500_phase12c_private_media_optimization.sql", import.meta.url),
  "utf8",
);
const mediaClient = await readFile(new URL("../src/features/studio-media-client.ts", import.meta.url), "utf8");
const mediaService = await readFile(new URL("../src/features/studio-media.ts", import.meta.url), "utf8");
const uploadForm = await readFile(
  new URL("../src/app/(studio)/studio/(protected)/media/media-upload-form.tsx", import.meta.url),
  "utf8",
);
const detailPage = await readFile(
  new URL("../src/app/(studio)/studio/(protected)/media/[mediaId]/page.tsx", import.meta.url),
  "utf8",
);

test("Phase 12C stores optimization metadata without exposing drafts publicly", () => {
  assert.match(migration, /optimized_storage_key text null unique/);
  assert.match(migration, /optimized_byte_size bigint/);
  assert.match(migration, /optimized_at timestamptz/);
  assert.match(migration, /bucket_id = 'media-private'/);
  assert.match(migration, /optimized\/%s\/main\.webp/);
  assert.doesNotMatch(migration, /media-public/);
});

test("Phase 12C optimization mutations stay behind controlled Studio RPCs", () => {
  assert.match(migration, /private\.prepare_media_optimized_variant_impl/);
  assert.match(migration, /public\.prepare_media_optimized_variant/);
  assert.match(migration, /private\.finalize_media_optimized_variant_impl/);
  assert.match(migration, /public\.finalize_media_optimized_variant/);
  assert.match(migration, /security invoker/);
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /studio can upload reserved optimized private media/);
});

test("Phase 12C uses free browser WebP optimization with a bounded output", () => {
  assert.match(mediaClient, /STUDIO_MEDIA_MAX_EDGE = 1920/);
  assert.match(mediaClient, /STUDIO_MEDIA_WEBP_QUALITY = 0\.82/);
  assert.match(mediaClient, /createImageBitmap/);
  assert.match(mediaClient, /canvas\.toBlob\(resolve, "image\/webp"/);
  assert.match(mediaClient, /"x-upsert": "false"/);
});

test("Phase 12C keeps original upload durable and exposes a real retry path", () => {
  assert.match(uploadForm, /finalizeStudioMediaUploadAction/);
  assert.match(uploadForm, /optimizeStudioMediaImage/);
  assert.match(uploadForm, /optimization=pending/);
  assert.match(detailPage, /MediaOptimizationPanel/);
  assert.match(detailPage, /Private only/);
  assert.match(mediaService, /optimized_storage_key/);
  assert.match(mediaService, /optimized_byte_size/);
});
