import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const previewPage = readFileSync(
  "src/app/(studio)/studio/(protected)/content/[localizationId]/preview/page.tsx",
  "utf8",
);
const previewFrame = readFileSync(
  "src/app/(studio)/studio/preview-frame/[localizationId]/page.tsx",
  "utf8",
);
const comparePage = readFileSync(
  "src/app/(studio)/studio/(protected)/content/[localizationId]/compare/page.tsx",
  "utf8",
);
const compareModel = readFileSync("src/features/studio-live-draft-compare.ts", "utf8");
const globalStyles = readFileSync("src/app/globals.css", "utf8");

test("draft preview exposes required device theme and language modes", () => {
  assert.match(previewPage, /Desktop/);
  assert.match(previewPage, /Mobile/);
  assert.match(previewPage, /Light/);
  assert.match(previewPage, /Dark/);
  assert.match(previewPage, /Language/);
  assert.match(previewPage, /studioLocaleLabel\(draft\.locale\)/);
  assert.match(previewPage, /studioLocaleLabel\(counterpartLocale\)/);
});

test("mobile preview uses an isolated iframe viewport instead of a cosmetic narrow wrapper", () => {
  assert.match(previewPage, /<iframe/);
  assert.match(previewPage, /studio\/preview-frame/);
  assert.match(previewPage, /data-device=\{device\}/);
});

test("preview frame independently enforces active Studio authorization", () => {
  assert.match(previewFrame, /inspectStudioSession/);
  assert.match(previewFrame, /session\.status === "forbidden"/);
  assert.match(previewFrame, /session\.status !== "active"/);
  assert.match(previewFrame, /index: false/);
});

test("Live versus Draft compare is read-only and uses immutable publication baseline", () => {
  assert.match(comparePage, /loadStudioPublicationStatus/);
  assert.match(comparePage, /loadStudioRevisionHistory/);
  assert.match(comparePage, /revision\.id === publication\.revisionId/);
  assert.match(comparePage, /buildStudioLiveDraftComparison/);
  assert.doesNotMatch(comparePage, /action=/);
  assert.doesNotMatch(comparePage, /publishStudioDraftAction|updateStudioDraftAction|archiveStudioPublicationAction/);
});

test("Live versus Draft comparison covers edition metadata and structured block changes", () => {
  assert.match(compareModel, /liveRevision\.snapshot\.title/);
  assert.match(compareModel, /liveRevision\.snapshot\.slug/);
  assert.match(compareModel, /liveRevision\.snapshot\.summary/);
  assert.match(compareModel, /added\.push/);
  assert.match(compareModel, /removed\.push/);
  assert.match(compareModel, /changed\.push/);
  assert.match(comparePage, /Reader block changes/);
});

test("Phase 11H styles are loaded globally", () => {
  assert.match(globalStyles, /studio-phase11-review\.css/);
});
