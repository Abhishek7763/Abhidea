import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  parseStudioPublicationRow,
  studioPublicationStateLabel,
} from "../src/features/studio-publication-model.ts";

const migrationUrl = new URL(
  "../supabase/migrations/20260823043500_phase11a_publication_safety.sql",
  import.meta.url,
);

const hardeningUrl = new URL(
  "../supabase/migrations/20260823044500_phase11a_publication_safety_hardening.sql",
  import.meta.url,
);

const editPageUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/page.tsx",
  import.meta.url,
);

test("publication status parser accepts a valid immutable revision snapshot link", () => {
  const parsed = parseStudioPublicationRow({
    localization_id: "11111111-1111-4111-8111-111111111111",
    revision_id: "22222222-2222-4222-8222-222222222222",
    slug: "safe-live-slug",
    publication_state: "published",
    published_at: "2026-08-22T20:00:00.000Z",
    updated_at: "2026-08-22T20:00:00.000Z",
    content_revisions: { revision_number: 3 },
  });

  assert.ok(parsed);
  assert.equal(parsed.revisionNumber, 3);
  assert.equal(studioPublicationStateLabel(parsed.state), "Published");
});

test("publication status parser fails closed on unsupported state", () => {
  const parsed = parseStudioPublicationRow({
    localization_id: "11111111-1111-4111-8111-111111111111",
    revision_id: "22222222-2222-4222-8222-222222222222",
    slug: "unsafe-state",
    publication_state: "scheduled",
    published_at: "2026-08-22T20:00:00.000Z",
    updated_at: "2026-08-22T20:00:00.000Z",
    content_revisions: { revision_number: 1 },
  });

  assert.equal(parsed, null);
});

test("Phase 11A schema keeps revisions immutable and exposes no publication writes", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /create table public\.content_revisions/i);
  assert.match(sql, /create table public\.published_localizations/i);
  assert.match(sql, /content_revisions_immutable/i);
  assert.match(sql, /unique \(locale, slug\)/i);
  assert.match(sql, /grant select on table public\.content_revisions to authenticated/i);
  assert.match(sql, /grant select on table public\.published_localizations to anon, authenticated/i);
  assert.doesNotMatch(sql, /grant[^;]*insert[^;]*content_revisions/i);
  assert.doesNotMatch(sql, /grant[^;]*insert[^;]*published_localizations/i);
  assert.match(sql, /publication_state = 'published'/i);
});

test("Phase 11A hardening avoids overlapping authenticated SELECT policies", async () => {
  const sql = await readFile(hardeningUrl, "utf8");

  assert.match(sql, /to anon\s+using \(publication_state = 'published'\)/i);
  assert.match(sql, /to authenticated\s+using \(/i);
  assert.match(sql, /publication_state = 'published'\s+or exists/i);
  assert.match(sql, /published_localizations_revision_localization_idx/i);
  assert.match(sql, /content_revisions_created_by_idx/i);
});

test("Studio editor explains draft/live separation without exposing a publish action", async () => {
  const page = await readFile(editPageUrl, "utf8");

  assert.match(page, /Publication safety/);
  assert.match(page, /Draft and live stay separate/);
  assert.match(page, /Never published/);
  assert.doesNotMatch(page, /Publish now/);
});
