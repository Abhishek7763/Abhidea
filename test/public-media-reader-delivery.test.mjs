import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../supabase/migrations/20260830060000_phase12e_public_media_reader_delivery.sql", import.meta.url),
  "utf8",
);
const publication = await readFile(new URL("../src/features/studio-publication.ts", import.meta.url), "utf8");
const publishedReader = await readFile(new URL("../src/features/reader/published-reader.ts", import.meta.url), "utf8");
const renderer = await readFile(new URL("../src/features/reader/structured-document-renderer.tsx", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const editorForm = await readFile(
  new URL("../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/editor-form.tsx", import.meta.url),
  "utf8",
);
const publicationModel = await readFile(new URL("../src/features/studio-publication-model.ts", import.meta.url), "utf8");

test("Phase 12E keeps draft media private and promotes only the optimized Reader variant", () => {
  assert.match(migration, /prepare_reader_media_promotion/);
  assert.match(migration, /source_storage_key/);
  assert.match(migration, /optimized_storage_key/);
  assert.match(migration, /bucket_id = 'media-public'/);
  assert.match(migration, /reader\/.*main\.webp/);
  assert.match(migration, /finalize_reader_media_promotion/);
  assert.match(migration, /public_storage_key/);
  assert.doesNotMatch(editorForm, /readyBlockedByPrivateMedia/);
  assert.match(editorForm, /Figure media remains private until Publish/);
});

test("publish helper promotes Figure media before the atomic publish RPC", () => {
  assert.match(publication, /prepare_reader_media_promotion/);
  assert.match(publication, /\/storage\/v1\/object\/copy/);
  assert.match(publication, /destinationBucket: "media-public"/);
  assert.match(publication, /finalize_reader_media_promotion/);
  assert.match(publication, /await promoteStudioDraftReaderMedia\(localizationId, expectedLockVersion\)/);
  assert.match(publication, /rpc\/publish_content_draft/);
});

test("published snapshots carry a self-contained public media manifest", () => {
  assert.match(migration, /add column media_json jsonb not null default '\[\]'::jsonb/);
  assert.match(migration, /'media', v_media/);
  assert.match(migration, /media_json = excluded\.media_json/);
  assert.match(migration, /when 'figure'/);
  assert.match(publicationModel, /"figure"/);
});

test("public Reader resolves Figure media without reading private media tables", () => {
  assert.match(publishedReader, /media_json/);
  assert.match(publishedReader, /storage\/v1\/object\/public\/media-public/);
  assert.match(publishedReader, /storageKey !== `reader\/\$\{mediaId\}\/main\.webp`/);
  assert.match(renderer, /parsed\.document\.media\?\.\[block\.mediaId\]/);
  assert.doesNotMatch(publishedReader, /rest\/v1\/media_assets/);
  assert.doesNotMatch(publishedReader, /media-private/);
});

test("Next Image allowlist is restricted to the public Reader media path", () => {
  assert.match(nextConfig, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(nextConfig, /\/storage\/v1\/object\/public\/media-public\/\*\*/);
});
