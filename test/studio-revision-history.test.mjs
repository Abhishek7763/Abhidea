import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildStudioRevisionComparison,
  parseStudioRevisionRow,
} from "../src/features/studio-publication-model.ts";

const publicationLoaderUrl = new URL("../src/features/studio-publication.ts", import.meta.url);
const editorPageUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/page.tsx",
  import.meta.url,
);
const revisionPageUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/[localizationId]/revisions/[revisionId]/page.tsx",
  import.meta.url,
);

function revisionRow({
  id,
  number,
  title,
  slug = "first-slug",
  summary,
  blocks,
  subjects,
  reason,
}) {
  return {
    id,
    localization_id: "localization-1",
    revision_number: number,
    reason,
    created_at: `2026-08-23T00:0${number}:00.000Z`,
    snapshot_json: {
      schemaVersion: 1,
      contentId: "content-1",
      localizationId: "localization-1",
      locale: "en",
      contentType: {
        id: "type-1",
        name: "Article",
        slug: "article",
      },
      title,
      slug,
      summary,
      body: {
        schemaVersion: 1,
        blocks,
      },
      subjects,
      editorialStatus: "ready",
    },
  };
}

test("revision parser accepts immutable publish snapshots and fails closed on unsafe block ids", () => {
  const parsed = parseStudioRevisionRow(
    revisionRow({
      id: "revision-1",
      number: 1,
      title: "First title",
      summary: "First summary",
      reason: "publish",
      blocks: [
        { id: "opening", type: "paragraph", text: "Opening" },
        { id: "section", type: "heading", level: 2, text: "Section" },
      ],
      subjects: [{ name: "AI", slug: "ai" }],
    }),
  );

  assert.ok(parsed);
  assert.equal(parsed.revisionNumber, 1);
  assert.equal(parsed.snapshot.body.blocks.length, 2);

  const invalid = parseStudioRevisionRow(
    revisionRow({
      id: "revision-bad",
      number: 2,
      title: "Unsafe",
      summary: "",
      reason: "republish",
      blocks: [
        { id: "duplicate", type: "paragraph", text: "One" },
        { id: "duplicate", type: "paragraph", text: "Two" },
      ],
      subjects: [],
    }),
  );
  assert.equal(invalid, null);
});

test("revision comparison reports metadata, taxonomy and stable block changes", () => {
  const before = parseStudioRevisionRow(
    revisionRow({
      id: "revision-1",
      number: 1,
      title: "First title",
      summary: "First summary",
      reason: "publish",
      blocks: [
        { id: "opening", type: "paragraph", text: "Old opening" },
        { id: "old-section", type: "heading", level: 2, text: "Old section" },
      ],
      subjects: [{ name: "AI", slug: "ai" }],
    }),
  );
  const after = parseStudioRevisionRow(
    revisionRow({
      id: "revision-2",
      number: 2,
      title: "Second title",
      summary: "Second summary",
      reason: "republish",
      blocks: [
        { id: "opening", type: "paragraph", text: "New opening" },
        { id: "new-section", type: "heading", level: 2, text: "New section" },
      ],
      subjects: [{ name: "Technology", slug: "technology" }],
    }),
  );

  assert.ok(before && after);
  const comparison = buildStudioRevisionComparison(before, after);

  assert.equal(comparison.hasChanges, true);
  assert.equal(comparison.title.changed, true);
  assert.equal(comparison.slug.changed, false);
  assert.equal(comparison.summary.changed, true);
  assert.deepEqual(comparison.subjects.added.map((subject) => subject.slug), ["technology"]);
  assert.deepEqual(comparison.subjects.removed.map((subject) => subject.slug), ["ai"]);
  assert.deepEqual(comparison.blocks.changed.map((block) => block.id), ["opening"]);
  assert.deepEqual(comparison.blocks.added.map((block) => block.id), ["new-section"]);
  assert.deepEqual(comparison.blocks.removed.map((block) => block.id), ["old-section"]);
});

test("Studio revision history uses authenticated private revision reads and exposes no restore mutation", async () => {
  const [loader, editor, revisionPage] = await Promise.all([
    readFile(publicationLoaderUrl, "utf8"),
    readFile(editorPageUrl, "utf8"),
    readFile(revisionPageUrl, "utf8"),
  ]);

  assert.match(loader, /rest\/v1\/content_revisions/);
  assert.match(loader, /localization_id/);
  assert.match(loader, /revision_number\.desc/);
  assert.doesNotMatch(loader, /service_role|SUPABASE_SECRET/i);
  assert.match(editor, /Revision history/);
  assert.match(editor, /Review revision/);
  assert.match(revisionPage, /Changes from Revision/);
  assert.match(revisionPage, /read-only publication record/i);
  assert.doesNotMatch(revisionPage, /restore revision|delete revision|unpublish/i);
});
