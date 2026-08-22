import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStudioDraftDocument,
  isStudioUuid,
  normalizeStudioDraftSlug,
} from "../src/features/studio-content-model.ts";

test("Create Draft slug normalizer derives Roman and Devanagari-safe slugs", () => {
  assert.equal(normalizeStudioDraftSlug("", "My First Idea!"), "my-first-idea");
  assert.equal(normalizeStudioDraftSlug("  ध्यान / अभ्यास  ", "ignored"), "ध्यान-अभ्यास");
  assert.equal(normalizeStudioDraftSlug("already--clean", "ignored"), "already-clean");
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

test("Create Draft UUID validation rejects malformed form ids", () => {
  assert.equal(isStudioUuid("69f3a86b-0d6d-4131-bfc8-9b38c352d001"), true);
  assert.equal(isStudioUuid("not-a-uuid"), false);
});
