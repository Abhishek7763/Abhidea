import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20260823080000_phase11g_activity_log.sql", "utf8");
const activityFeature = readFileSync("src/features/studio-activity.ts", "utf8");
const activityPage = readFileSync("src/app/(studio)/studio/(protected)/activity/page.tsx", "utf8");
const navigation = readFileSync("src/features/studio-navigation.tsx", "utf8");
const globalStyles = readFileSync("src/app/globals.css", "utf8");

test("activity migration is append-only and Studio-readable only", () => {
  assert.match(migration, /create table public\.studio_activity_events/);
  assert.match(migration, /grant select on table public\.studio_activity_events to authenticated/);
  assert.match(migration, /revoke all on table public\.studio_activity_events from anon, authenticated/);
  assert.match(migration, /active studio members can read activity/);
  assert.match(migration, /Studio activity events are append-only/);
});

test("activity log covers writing publishing and lifecycle events", () => {
  for (const eventType of [
    "draft_created",
    "draft_saved",
    "published",
    "republished",
    "archived",
    "trashed",
    "restored",
  ]) {
    assert.match(migration, new RegExp(`'${eventType}'`));
  }
});

test("publish internal draft reset is suppressed in favor of revision activity", () => {
  assert.match(migration, /from public\.content_revisions r/);
  assert.match(migration, /r\.created_at = now\(\)/);
  assert.match(migration, /content_revisions_activity_log/);
  assert.match(migration, /revisionNumber/);
});

test("migration backfills durable historical signals without inventing old saves", () => {
  assert.match(migration, /'draft_created'/);
  assert.match(migration, /from public\.content_revisions r/);
  assert.match(migration, /where pl\.publication_state = 'archived'/);
  assert.match(migration, /where cl\.lifecycle_state = 'trashed'/);
});

test("activity loader is bounded newest-first and read-only", () => {
  assert.match(activityFeature, /const ACTIVITY_LIMIT = 200/);
  assert.match(activityFeature, /occurred_at\.desc,id\.desc/);
  assert.doesNotMatch(activityFeature, /method:\s*["'](?:POST|PATCH|PUT|DELETE)["']/);
});

test("Studio exposes Activity navigation and filtered timeline UI", () => {
  assert.match(navigation, /href: "\/studio\/activity"/);
  assert.match(activityPage, /All activity/);
  assert.match(activityPage, /Writing/);
  assert.match(activityPage, /Publishing/);
  assert.match(activityPage, /Lifecycle/);
  assert.match(globalStyles, /studio-activity\.css/);
});
