import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/20260823084000_phase12b_media_upload_workflow.sql", import.meta.url), "utf8");
const mediaService = await readFile(new URL("../src/features/studio-media.ts", import.meta.url), "utf8");
const uploadForm = await readFile(new URL("../src/app/(studio)/studio/(protected)/media/media-upload-form.tsx", import.meta.url), "utf8");
const mediaPage = await readFile(new URL("../src/app/(studio)/studio/(protected)/media/page.tsx", import.meta.url), "utf8");

test("Phase 12B reserves, finalizes and edits media only through controlled RPCs", () => {
  assert.match(migration, /private\.reserve_media_upload_impl/);
  assert.match(migration, /public\.reserve_media_upload/);
  assert.match(migration, /private\.finalize_media_upload_impl/);
  assert.match(migration, /public\.finalize_media_upload/);
  assert.match(migration, /private\.update_media_metadata_impl/);
  assert.match(migration, /public\.update_media_metadata/);
  assert.match(migration, /asset_state = 'ready'/);
});

test("Phase 12B keeps uploads in reserved private paths with narrow cleanup", () => {
  assert.match(migration, /uploads\/%s\/%s\/original\.%s/);
  assert.match(migration, /bucket_id = 'media-private'/);
  assert.match(migration, /studio can clean failed private media uploads/);
  assert.match(migration, /ma\.asset_state = 'staged'/);
  assert.match(migration, /ma\.private_storage_key is null/);
  assert.doesNotMatch(migration, /bucket_id = 'media-public'[\s\S]*for insert to authenticated/i);
});

test("Phase 12B sends file bytes directly to signed Supabase Storage", () => {
  assert.match(mediaService, /object\/upload\/sign\/\$\{bucket\}/);
  assert.match(mediaService, /createSignedMediaUploadTicket\("media-private", storageKey\)/);
  assert.match(uploadForm, /reservation\.signedUploadUrl/);
  assert.match(uploadForm, /method: "PUT"/);
  assert.match(uploadForm, /"x-upsert": "false"/);
  assert.match(uploadForm, /hasExpectedImageSignature/);
});

test("Phase 12B opens a reusable protected Media Library", () => {
  assert.match(mediaPage, /<MediaUploadForm \/>/);
  assert.match(mediaPage, /Media Library/);
  assert.match(mediaPage, /Open details/);
  assert.match(mediaService, /createSignedPreviewUrls/);
  assert.match(mediaService, /media_usages/);
});
