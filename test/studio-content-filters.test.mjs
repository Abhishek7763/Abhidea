import assert from "node:assert/strict";
import test from "node:test";

import {
  filterStudioContentItems,
  hasActiveStudioContentFilters,
  normalizeStudioContentFilters,
} from "../src/features/studio-content-model.ts";

const items = [
  {
    localizationId: "loc-en",
    contentId: "content-1",
    title: "English article",
    slug: "english-article",
    summary: "Summary",
    locale: "en",
    status: "draft",
    updatedAt: "2026-08-22T10:00:00Z",
    contentType: { id: "type-article", name: "Article", slug: "article" },
  },
  {
    localizationId: "loc-hi",
    contentId: "content-2",
    title: "Hindi summary",
    slug: "hindi-summary",
    summary: "Summary",
    locale: "hi",
    status: "ready",
    updatedAt: "2026-08-22T11:00:00Z",
    contentType: { id: "type-book", name: "Book Summary", slug: "book-summary" },
  },
];

test("Studio content filters normalize unknown query values safely", () => {
  assert.deepEqual(
    normalizeStudioContentFilters({ type: "../bad", status: "published", locale: "fr" }),
    { type: "all", status: "all", locale: "all" },
  );

  assert.deepEqual(
    normalizeStudioContentFilters({ type: ["book-summary", "article"], status: "ready", locale: "hi" }),
    { type: "book-summary", status: "ready", locale: "hi" },
  );
});

test("Studio content list combines type, status and language filters", () => {
  const filtered = filterStudioContentItems(items, {
    type: "book-summary",
    status: "ready",
    locale: "hi",
  });

  assert.deepEqual(filtered.map((item) => item.localizationId), ["loc-hi"]);
});

test("Studio content all-filter keeps the full list and reports no active filters", () => {
  const filters = { type: "all", status: "all", locale: "all" };
  assert.equal(filterStudioContentItems(items, filters).length, 2);
  assert.equal(hasActiveStudioContentFilters(filters), false);
});
