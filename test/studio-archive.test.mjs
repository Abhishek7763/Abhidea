import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL("../supabase/migrations/20260823072000_phase11e_archive_publication.sql", import.meta.url);
const pagePath = new URL("../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/page.tsx", import.meta.url);
const actionPath = new URL("../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/archive-action.ts", import.meta.url);
const formPath = new URL("../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/archive-form.tsx", import.meta.url);

const [migration, page, action, form] = await Promise.all([
  readFile(migrationPath, "utf8"),
  readFile(pagePath, "utf8"),
  readFile(actionPath, "utf8"),
  readFile(formPath, "utf8"),
]);

test("archive RPC preserves snapshots and only changes publication state", () => {
  assert.match(migration, /publication_state = 'archived'/);
  assert.doesNotMatch(migration, /delete\s+from\s+public\.content_revisions/i);
  assert.doesNotMatch(migration, /delete\s+from\s+public\.published_localizations/i);
  assert.match(migration, /v_live\.revision_id <> p_expected_revision_id/);
  assert.match(migration, /errcode = '40001'/);
});

test("archive RPC is authenticated-only", () => {
  assert.match(migration, /revoke all on function public\.archive_published_localization\(uuid, uuid\)/);
  assert.match(migration, /grant execute on function public\.archive_published_localization\(uuid, uuid\)\s+to authenticated/);
});

test("Studio exposes explicit archive and republish lifecycle", () => {
  assert.match(form, /Unpublish & archive/);
  assert.match(form, /confirmArchive/);
  assert.match(page, /Archived — public Reader is offline/);
  assert.match(page, /Republish archived edition/);
  assert.match(page, /publication\?\.state === "published" && publication\.revisionId === revision\.id/);
  assert.match(action, /expectedRevisionId/);
  assert.match(action, /confirmArchive/);
  assert.match(action, /archived=1/);
});
