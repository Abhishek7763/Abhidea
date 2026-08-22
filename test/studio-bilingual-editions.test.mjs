import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStudioDraftDocument,
  normalizeStudioDraftSlug,
  otherStudioContentLocale,
} from "../src/features/studio-content-model.ts";

test("bilingual counterpart locale always resolves to the other supported edition", () => {
  assert.equal(otherStudioContentLocale("en"), "hi");
  assert.equal(otherStudioContentLocale("hi"), "en");
  assert.equal(otherStudioContentLocale(otherStudioContentLocale("en")), "en");
});

test("English and Hindi editions keep independent localized slugs", () => {
  assert.equal(normalizeStudioDraftSlug("", "Learning with attention"), "learning-with-attention");
  assert.equal(normalizeStudioDraftSlug("", "ध्यान से सीखना"), "ध्यान-से-सीखना");
});

test("a linked edition starter body is built only from the localized text supplied", () => {
  assert.deepEqual(buildStudioDraftDocument("पहला अनुच्छेद।\n\nदूसरा अनुच्छेद।"), {
    schemaVersion: 1,
    blocks: [
      { id: "paragraph-1", type: "paragraph", text: "पहला अनुच्छेद।" },
      { id: "paragraph-2", type: "paragraph", text: "दूसरा अनुच्छेद।" },
    ],
  });
});
