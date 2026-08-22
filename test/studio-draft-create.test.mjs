import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStudioDraftDocument,
  isStudioUuid,
  normalizeStudioDraftSlug,
} from "../src/features/studio-content-model.ts";

test("Draft slug normalizer creates stable English slugs", () => {
  assert.equal(normalizeStudioDraftSlug("", "Atomic Habits: Small Changes"), "atomic-habits-small-changes");
  assert.equal(normalizeStudioDraftSlug("  Custom--Slug  ", "Ignored"), "custom-slug");
});

test("Draft slug normalizer preserves Devanagari letters and combining marks", () => {
  assert.equal(normalizeStudioDraftSlug("", "ध्यान और सीखना"), "ध्यान-और-सीखना");
  assert.equal(normalizeStudioDraftSlug("हिंदी-विचार", "Ignored"), "हिंदी-विचार");
});

test("Draft slug normalizer removes route-breaking punctuation and caps length", () => {
  assert.equal(normalizeStudioDraftSlug("hello/world?draft#1", "Ignored"), "hello-world-draft-1");
  assert.ok(normalizeStudioDraftSlug("a".repeat(240), "Ignored").length <= 180);
});

test("Starter body becomes canonical schemaVersion 1 paragraph blocks", () => {
  assert.deepEqual(buildStudioDraftDocument("First line\nstill first.\n\nSecond paragraph."), {
    schemaVersion: 1,
    blocks: [
      { id: "paragraph-1", type: "paragraph", text: "First line still first." },
      { id: "paragraph-2", type: "paragraph", text: "Second paragraph." },
    ],
  });
});

test("Empty starter body remains a valid empty Reader document", () => {
  assert.deepEqual(buildStudioDraftDocument("  \n\n  "), {
    schemaVersion: 1,
    blocks: [],
  });
});

test("Studio UUID validation accepts canonical UUIDs and rejects arbitrary input", () => {
  assert.equal(isStudioUuid("69f3a86b-0d6d-4131-bfc8-9b38c352d001"), true);
  assert.equal(isStudioUuid("not-a-uuid"), false);
});
