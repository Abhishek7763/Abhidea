import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const editorFormUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/editor-form.tsx",
  import.meta.url,
);
const editPageUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/page.tsx",
  import.meta.url,
);
const publishFormUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/publish-form.tsx",
  import.meta.url,
);

test("editor makes Ready an explicit mobile-friendly action before publish", async () => {
  const editor = await readFile(editorFormUrl, "utf8");

  assert.match(editor, /Mark Ready/);
  assert.match(editor, /Save as Ready/);
  assert.match(editor, /Ready — unlock Publish after save/);
  assert.match(editor, /setEditorialStatus\("ready"\)/);
  assert.match(editor, /Nothing goes live until you separately press Publish/);
});

test("editor page exposes a visible Draft to Live workflow and actionable blockers", async () => {
  const page = await readFile(editPageUrl, "utf8");

  assert.match(page, /Publish workflow/);
  assert.match(page, /Mark Ready (?:&amp;|&) Save/);
  assert.match(page, /Continue to Publish/);
  assert.match(page, /Publish is still locked/);
  assert.match(page, /Fix in Draft details/);
  assert.match(page, /Ready saved — Publish is unlocked/);
});

test("successful publish gives a direct live Reader action while preserving explicit publish", async () => {
  const [page, publishForm] = await Promise.all([
    readFile(editPageUrl, "utf8"),
    readFile(publishFormUrl, "utf8"),
  ]);

  assert.match(page, /Published successfully/);
  assert.match(page, /View live Reader/);
  assert.match(page, /const liveHref = publication/);
  assert.match(page, /read\/\$\{publication\.slug\}/);
  assert.match(publishForm, /Publish saved draft/);
  assert.doesNotMatch(page, /auto.?publish/i);
});
