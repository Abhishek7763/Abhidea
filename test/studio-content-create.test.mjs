import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStudioDraftDocument,
  isStudioUuid,
  normalizeStudioDraftSlug,
} from "../src/features/studio-content-model.ts";

test("Create Draft slug normalizer derives stable English slugs", () => {
  assert.equal(normalizeStudioDraftSlug("", "Atomic Habits: Small Changes"), "atomic-habits-small-changes");
  assert.equal(normalizeStudioDraftSlug("  Custom--Slug  ", "ignored"), "custom-slug");
});

test("Create Draft slug normalizer preserves Devanagari letters and combining marks", () => {
  assert.equal(normalizeStudioDraftSlug("", "ध्यान और सीखना"), "ध्यान-और-सीखना");
  assert.equal(normalizeStudioDraftSlug("  ध्यान / अभ्यास  ", "ignored"), "ध्यान-अभ्यास");
});

test("Create Draft slug normalizer removes route-breaking punctuation and caps length", () => {
  assert.equal(normalizeStudioDraftSlug("hello/world?draft#1", "ignored"), "hello-world-draft-1");
  assert.ok(normalizeStudioDraftSlug("a".repeat(240), "ignored").length <= 180);
});

test("Create Draft body becomes canonical paragraph blocks", () => {
  assert.deepEqual(buildStudioDraftDocument("First line.\nStill first.\n\nSecond paragraph."), {
    schemaVersion: 1,
    blocks: [
      { id: "paragraph-1", type: "paragraph", text: "First line. Still first." },
      { id: "paragraph-2", type: "paragraph", text: "Second paragraph." },
    ],
  });
});

test("Create Draft empty starter body remains a valid empty Reader document", () => {
  assert.deepEqual(buildStudioDraftDocument("  \n\n  "), {
    schemaVersion: 1,
    blocks: [],
  });
});

test("Create Draft UUID validation rejects malformed form ids", () => {
  assert.equal(isStudioUuid("69f3a86b-0d6d-4131-bfc8-9b38c352d001"), true);
  assert.equal(isStudioUuid("not-a-uuid"), false);
});
