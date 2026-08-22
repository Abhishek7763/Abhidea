import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildStudioPublishPreflight } from "../src/features/studio-publication-model.ts";

const migrationUrl = new URL(
  "../supabase/migrations/20260823051500_phase11b_publish_transaction.sql",
  import.meta.url,
);
const editPageUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/page.tsx",
  import.meta.url,
);

test("publish preflight requires a saved Ready draft with body content", () => {
  const blocked = buildStudioPublishPreflight({
    title: "Publishable title",
    slug: "publishable-title",
    summary: "",
    status: "draft",
    document: { ok: true, document: { blocks: [] } },
  });

  assert.equal(blocked.ready, false);
  assert.equal(blocked.blockers.length, 2);

  const ready = buildStudioPublishPreflight({
    title: "Publishable title",
    slug: "publishable-title",
    summary: "",
    status: "ready",
    document: { ok: true, document: { blocks: [{ type: "paragraph" }] } },
  });

  assert.deepEqual(ready, { ready: true, blockers: [] });
});

test("publish migration keeps privileged writes private and public RPC invoker-only", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /private\.publish_content_draft_impl/i);
  assert.match(sql, /security definer/i);
  assert.match(sql, /public\.publish_content_draft/i);
  assert.match(sql, /language sql\s+security invoker/i);
  assert.match(sql, /for update of d/i);
  assert.match(sql, /editorial_status <> 'ready'/i);
  assert.match(sql, /insert into public\.content_revisions/i);
  assert.match(sql, /insert into public\.published_localizations/i);
  assert.match(sql, /on conflict \(localization_id\) do update/i);
  assert.match(sql, /editorial_status = 'draft'/i);
  assert.match(sql, /lock_version = d\.lock_version \+ 1/i);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)[^;]*published_localizations/i);
});

test("Studio exposes explicit preflight and no automatic publish", async () => {
  const page = await readFile(editPageUrl, "utf8");

  assert.match(page, /Publish preflight/);
  assert.match(page, /Publish saved draft/);
  assert.match(page, /Unsaved editor changes are not included/);
  assert.doesNotMatch(page, /autosave.*publish/i);
});
