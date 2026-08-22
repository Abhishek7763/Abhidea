import assert from "node:assert/strict";
import test from "node:test";

import { parseReaderDocument } from "../src/features/reader/document-schema.ts";

test("Phase 10D editable blocks are valid Reader schemaVersion 1 blocks", () => {
  const parsed = parseReaderDocument({
    schemaVersion: 1,
    blocks: [
      { id: "p1", type: "paragraph", text: "Paragraph" },
      { id: "h1", type: "heading", level: 2, text: "Heading" },
      { id: "q1", type: "quote", text: "Quote", attribution: "Source" },
      { id: "l1", type: "list", style: "unordered", items: ["One", "Two"] },
      { id: "c1", type: "callout", tone: "key-idea", title: "Key idea", text: "Remember this" },
      { id: "d1", type: "divider" },
      { id: "x1", type: "closure", variant: "conclusion", title: "Conclusion", text: "Done" },
    ],
  });

  assert.equal(parsed.schemaSupported, true);
  assert.equal(parsed.ignoredBlocks, 0);
  assert.deepEqual(parsed.document.blocks.map((block) => block.type), [
    "paragraph",
    "heading",
    "quote",
    "list",
    "callout",
    "divider",
    "closure",
  ]);
});

test("Reader parser remains fail-closed for malformed editor blocks", () => {
  const parsed = parseReaderDocument({
    schemaVersion: 1,
    blocks: [
      { id: "ok", type: "paragraph", text: "Safe" },
      { id: "bad", type: "heading", level: 9, text: "Invalid heading" },
      { id: "unknown", type: "script", text: "Never render" },
    ],
  });

  assert.equal(parsed.schemaSupported, true);
  assert.equal(parsed.ignoredBlocks, 2);
  assert.equal(parsed.document.blocks.length, 1);
  assert.equal(parsed.document.blocks[0].type, "paragraph");
});
