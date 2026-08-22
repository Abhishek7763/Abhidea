import assert from "node:assert/strict";
import test from "node:test";

import { buildStudioPreviewEntry, estimateStudioPreviewMinutes } from "../src/features/studio-preview.ts";

const document = {
  schemaVersion: 1,
  blocks: [
    { id: "intro", type: "paragraph", text: "A short saved draft paragraph." },
    { id: "heading", type: "heading", level: 2, text: "A real Reader heading" },
  ],
};

const draft = {
  localizationId: "11111111-1111-4111-8111-111111111111",
  contentId: "22222222-2222-4222-8222-222222222222",
  title: "Preview title",
  slug: "preview-title",
  summary: "Preview summary",
  locale: "en",
  status: "draft",
  lockVersion: 3,
  updatedAt: "2026-08-22T16:00:00.000Z",
  contentType: {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Article",
    slug: "article",
  },
  document: { ok: true, document },
};

test("preview reading time never falls below one minute", () => {
  assert.equal(estimateStudioPreviewMinutes(document.blocks), 1);
});

test("draft preview reuses the saved structured document without publishing metadata", () => {
  const preview = buildStudioPreviewEntry(draft, [
    {
      localizationId: draft.localizationId,
      contentId: draft.contentId,
      locale: "en",
    },
    {
      localizationId: "44444444-4444-4444-8444-444444444444",
      contentId: draft.contentId,
      locale: "hi",
    },
  ]);

  assert.ok(preview.entry);
  assert.equal(preview.entry.title, draft.title);
  assert.equal(preview.entry.body.schemaVersion, 1);
  assert.deepEqual(preview.entry.body.blocks, document.blocks);
  assert.equal(preview.entry.sources.length, 0);
  assert.equal(preview.entry.related.length, 0);
  assert.equal(preview.alternateLocalizationId, "44444444-4444-4444-8444-444444444444");
});

test("unsupported saved body fails closed instead of inventing preview content", () => {
  const preview = buildStudioPreviewEntry(
    {
      ...draft,
      document: { ok: false, message: "Unsupported block" },
    },
    [],
  );

  assert.equal(preview.entry, null);
  assert.equal(preview.alternateLocalizationId, null);
});
