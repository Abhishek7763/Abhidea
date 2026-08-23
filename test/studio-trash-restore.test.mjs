import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/20260823075000_phase11f_trash_restore.sql",
  import.meta.url,
);
const contentFeatureUrl = new URL("../src/features/studio-content.ts", import.meta.url);
const editorFeatureUrl = new URL("../src/features/studio-editor.ts", import.meta.url);
const trashPageUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/trash/page.tsx",
  import.meta.url,
);
const restoreFormUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/trash/restore-form.tsx",
  import.meta.url,
);
const trashActionsUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/trash/actions.ts",
  import.meta.url,
);
const editPageUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/page.tsx",
  import.meta.url,
);
const newEditionPageUrl = new URL(
  "../src/app/(studio)/studio/(protected)/content/[localizationId]/new-edition/page.tsx",
  import.meta.url,
);

test("Trash lifecycle is reversible and never deletes saved content", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  assert.match(migration, /lifecycle_state text not null default 'active'/);
  assert.match(migration, /lifecycle_state in \('active', 'trashed'\)/);
  assert.match(migration, /publication_state = 'archived'/);
  assert.match(migration, /restore_content_localization/);
  assert.match(migration, /revoke update on table public\.content_localizations from authenticated/);
  assert.match(migration, /content_drafts_block_trashed_update/);
  assert.match(migration, /published_localizations_block_trashed_activation/);
  assert.doesNotMatch(migration, /delete\s+from\s+public\.(content_drafts|content_revisions|content_localizations|published_localizations)/i);
});

test("active library and editor exclude Trash while Trash has its own loader", async () => {
  const [contentFeature, editorFeature] = await Promise.all([
    readFile(contentFeatureUrl, "utf8"),
    readFile(editorFeatureUrl, "utf8"),
  ]);

  assert.match(contentFeature, /content_localizations\.lifecycle_state", "eq\.active"/);
  assert.match(contentFeature, /loadStudioTrashList/);
  assert.match(contentFeature, /content_localizations\.lifecycle_state", "eq\.trashed"/);
  assert.match(editorFeature, /content_localizations\.lifecycle_state", "eq\.active"/);
  assert.match(editorFeature, /lifecycleState: "active" \| "trashed"/);
});

test("Studio exposes explicit Trash and Restore without automatic republish", async () => {
  const [trashPage, restoreForm, trashActions, editPage, newEditionPage] = await Promise.all([
    readFile(trashPageUrl, "utf8"),
    readFile(restoreFormUrl, "utf8"),
    readFile(trashActionsUrl, "utf8"),
    readFile(editPageUrl, "utf8"),
    readFile(newEditionPageUrl, "utf8"),
  ]);

  assert.match(trashPage, /Restore without republishing/);
  assert.match(restoreForm, /Restore edition/);
  assert.match(trashActions, /trashStudioLocalization/);
  assert.match(trashActions, /restoreStudioLocalization/);
  assert.match(editPage, /Move this language edition to Trash/);
  assert.match(editPage, /Restore .* from Trash/);
  assert.match(newEditionPage, /existingTarget\?\.lifecycleState === "trashed"/);
  assert.doesNotMatch(trashActions, /publishStudioDraft/);
});
