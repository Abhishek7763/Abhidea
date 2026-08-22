import assert from "node:assert/strict";
import test from "node:test";

import {
  getTableOfContents,
  parseReaderDocument,
} from "../src/features/reader/document-schema.ts";

test("Reader parser ignores unknown and malformed blocks safely", () => {
  const parsed = parseReaderDocument({
    schemaVersion: 1,
    blocks: [
      { id: "intro", type: "paragraph", text: "Useful text" },
      { id: "unknown", type: "raw-html", html: "<script>alert(1)</script>" },
      { id: "bad-heading", type: "heading", level: 1, text: "Invalid level" },
    ],
  });

  assert.equal(parsed.schemaSupported, true);
  assert.equal(parsed.ignoredBlocks, 2);
  assert.deepEqual(parsed.document.blocks, [
    { id: "intro", type: "paragraph", text: "Useful text" },
  ]);
});

test("Reader parser fails closed for unsupported schema versions", () => {
  const parsed = parseReaderDocument({
    schemaVersion: 99,
    blocks: [{ id: "intro", type: "paragraph", text: "Should not render" }],
  });

  assert.equal(parsed.schemaSupported, false);
  assert.equal(parsed.document.schemaVersion, 1);
  assert.deepEqual(parsed.document.blocks, []);
});

test("Reader table of contents generates stable unique anchors for duplicate block ids", () => {
  const toc = getTableOfContents({
    schemaVersion: 1,
    blocks: [
      { id: "focus", type: "heading", level: 2, text: "First" },
      { id: "focus", type: "heading", level: 3, text: "Second" },
    ],
  });

  assert.deepEqual(toc, [
    { id: "section-focus", level: 2, text: "First" },
    { id: "section-focus-2", level: 3, text: "Second" },
  ]);
});
