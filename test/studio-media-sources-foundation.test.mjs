import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/20260823081000_phase12a_media_sources_foundation.sql",
  import.meta.url,
);
const docsUrl = new URL(
  "../docs/PHASE_12A_MEDIA_SOURCES_FOUNDATION.md",
  import.meta.url,
);

test("Phase 12A creates reusable Source and Media registries", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  assert.match(migration, /create table public\.sources/);
  assert.match(migration, /create table public\.content_sources/);
  assert.match(migration, /create table public\.media_assets/);
  assert.match(migration, /create table public\.media_usages/);
  assert.match(migration, /link_status in \('unchecked', 'healthy', 'redirected', 'broken', 'blocked'\)/);
  assert.match(migration, /media_usages_identity_idx/);
  assert.match(migration, /validate_media_usage_localization/);
});

test("Phase 12A keeps working Source and Media metadata private", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  assert.match(
    migration,
    /revoke all on public\.sources, public\.content_sources, public\.media_assets, public\.media_usages\s+from anon, authenticated/,
  );
  assert.doesNotMatch(migration, /grant select[^;]*public\.media_assets to anon/);
  assert.doesNotMatch(migration, /grant select[^;]*public\.sources to anon/);
  assert.match(migration, /grant select on public\.media_assets to authenticated/);
  assert.doesNotMatch(migration, /grant [^;]*(?:insert|update|delete)[^;]*public\.media_assets to authenticated/i);
});

test("Phase 12A prevents direct destructive registry operations", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  assert.doesNotMatch(migration, /grant [^;]*delete[^;]*public\.sources to authenticated/i);
  assert.doesNotMatch(migration, /grant [^;]*delete[^;]*public\.media_assets to authenticated/i);
  assert.match(migration, /source_id uuid not null references public\.sources\(id\) on delete restrict/);
  assert.match(migration, /media_id uuid not null references public\.media_assets\(id\) on delete restrict/);
});

test("Phase 12A Storage boundary stages privately and exposes no browser public writes", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  assert.match(migration, /'media-private'/);
  assert.match(migration, /'media-public'/);
  assert.match(migration, /10485760/);
  assert.match(migration, /image\/jpeg/);
  assert.match(migration, /image\/webp/);
  assert.match(migration, /image\/avif/);
  assert.match(migration, /studio can upload reserved private media/);
  assert.match(migration, /storage\.foldername\(name\)\)\[2\] = \(select auth\.uid\(\)\)::text/);
  assert.match(migration, /ma\.id::text = \(storage\.foldername\(name\)\)\[3\]/);
  assert.doesNotMatch(migration, /on storage\.objects for delete/);
  assert.doesNotMatch(migration, /bucket_id = 'media-public'[\s\S]*for insert/);
});

test("Phase 12A documents public metadata hardening and deferred upload workflow", async () => {
  const docs = await readFile(docsUrl, "utf8");

  assert.match(docs, /does \*\*not\*\* grant anon table access/);
  assert.match(docs, /controlled reservation\/upload workflow will be added in 12B/);
  assert.match(docs, /no orphan destructive behavior/i);
});
