import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/20260823053500_phase11c_published_reader_delivery.sql",
  import.meta.url,
);
const loaderUrl = new URL("../src/features/reader/published-reader.ts", import.meta.url);
const deliveryUrl = new URL("../src/features/reader/reader-delivery.ts", import.meta.url);
const readerViewUrl = new URL("../src/features/reader/reader-view.tsx", import.meta.url);

test("live publication snapshots carry Reader-safe content type metadata", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /add column content_type_name text/i);
  assert.match(sql, /add column content_type_slug text/i);
  assert.match(sql, /private\.stamp_publication_content_type/i);
  assert.match(sql, /security invoker/i);
  assert.match(sql, /before insert or update of content_type_id/i);
  assert.doesNotMatch(sql, /grant execute[^;]*anon/i);
});

test("public Reader loader reads published snapshots only", async () => {
  const source = await readFile(loaderUrl, "utf8");

  assert.match(source, /rest\/v1\/published_localizations/);
  assert.match(source, /publication_state.*eq\.published/s);
  assert.match(source, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(source, /service_role|SUPABASE_SECRET|content_drafts|content_revisions/i);
});

test("published CMS content wins before QA fixture fallback", async () => {
  const source = await readFile(deliveryUrl, "utf8");
  const publishedCall = source.indexOf("const published = await getPublishedReaderEntry");
  const fixtureCall = source.indexOf("const fixture = getReaderFixture");

  assert.ok(publishedCall >= 0);
  assert.ok(fixtureCall >= 0);
  assert.ok(publishedCall < fixtureCall);
});

test("Reader metadata distinguishes published pages from noindex fixtures", async () => {
  const source = await readFile(readerViewUrl, "utf8");

  assert.match(source, /buildPublishedReaderMetadata/);
  assert.match(source, /buildReaderMetadata\(entry, true\)/);
  assert.match(source, /buildReaderMetadata\(entry, false\)/);
  assert.match(source, /Hindi edition is not published yet/);
});
