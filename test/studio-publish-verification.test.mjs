import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readerUrl = new URL("../src/features/reader/published-reader.ts", import.meta.url);
const actionsUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/actions.ts",
  import.meta.url,
);
const publishFormUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/publish-form.tsx",
  import.meta.url,
);

test("post-publish verification uses the public published-only Reader boundary", async () => {
  const reader = await readFile(readerUrl, "utf8");

  assert.match(reader, /verifyPublishedReaderSnapshot/);
  assert.match(reader, /Authorization: `Bearer \$\{publishableKey\}`/);
  assert.match(reader, /publication_state.*eq\.published/s);
  assert.match(reader, /revision_id.*expectedRevisionId/s);
  assert.match(reader, /parsePublishedReaderRow\(rows\[0\]\)/);
});

test("green publish success happens only after public verification", async () => {
  const actions = await readFile(actionsUrl, "utf8");

  const publishIndex = actions.indexOf("publishStudioDraft(localizationId, expectedLockVersion)");
  const verifyIndex = actions.indexOf("verifyPublishedReaderSnapshot(localizationId, publishResult.revisionId)");
  const successRedirectIndex = actions.indexOf("edit?published=1");

  assert.ok(publishIndex >= 0);
  assert.ok(verifyIndex > publishIndex);
  assert.ok(successRedirectIndex > verifyIndex);
  assert.match(actions, /status: "pending"/);
  assert.match(actions, /Do not publish again/);
});

test("verification-pending state disables repeat publish", async () => {
  const publishForm = await readFile(publishFormUrl, "utf8");

  assert.match(publishForm, /state\.status === "pending"/);
  assert.match(publishForm, /disabled=\{isPending \|\| verificationPending\}/);
  assert.match(publishForm, /Published — verification pending/);
});
