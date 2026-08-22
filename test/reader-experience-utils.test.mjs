import assert from "node:assert/strict";
import test from "node:test";

import {
  clampPercent,
  splitSpeechText,
} from "../src/features/reader/reader-experience-utils.ts";

test("Reader progress clamps and rounds safely", () => {
  assert.equal(clampPercent(-12), 0);
  assert.equal(clampPercent(42.6), 43);
  assert.equal(clampPercent(140), 100);
  assert.equal(clampPercent(Number.NaN), 0);
});

test("Speech text splitter keeps short text intact", () => {
  assert.deepEqual(splitSpeechText("A short paragraph."), ["A short paragraph."]);
});

test("Speech text splitter creates bounded chunks for long English and Hindi text", () => {
  const english = "Attention is trainable. It becomes easier to return when the environment is calmer. Repeated switching makes reading harder. A small ritual can reduce that friction.";
  const hindi = "ध्यान एक अभ्यास है। बार-बार लौटने से यह मजबूत होता है। शांत वातावरण पढ़ने और समझने को आसान बनाता है।";

  const englishChunks = splitSpeechText(english, 72);
  const hindiChunks = splitSpeechText(hindi, 58);

  assert.ok(englishChunks.length > 1);
  assert.ok(hindiChunks.length > 1);
  assert.ok(englishChunks.every((chunk) => chunk.length <= 72));
  assert.ok(hindiChunks.every((chunk) => chunk.length <= 58));
  assert.equal(englishChunks.join(" ").replace(/\s+/g, " "), english);
  assert.equal(hindiChunks.join(" ").replace(/\s+/g, " "), hindi);
});
