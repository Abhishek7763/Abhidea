import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/20260823150000_phase12d_editor_media_linking.sql", import.meta.url), "utf8");
const editorModel = await readFile(new URL("../src/features/studio-editor-model.ts", import.meta.url), "utf8");
const editorForm = await readFile(new URL("../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/editor-form.tsx", import.meta.url), "utf8");
const pickerAction = await readFile(new URL("../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/media-picker-actions.ts", import.meta.url), "utf8");
const picker = await readFile(new URL("../src/app/(studio)/studio/(protected)/content/[localizationId]/edit/figure-media-picker.tsx", import.meta.url), "utf8");

test("Phase 12D enables Reader Figure blocks in the structured editor", () => {
  assert.match(editorModel, /"figure"/);
  assert.match(editorModel, /mediaId: "", alt: ""/);
  assert.match(editorForm, /figure: "Figure"/);
  assert.match(editorForm, /<FigureMediaPicker/);
  assert.match(picker, /Choose from Media Library/);
});

test("Phase 12D picker exposes only optimized ready private media", () => {
  assert.match(pickerAction, /asset\.assetState !== "ready"/);
  assert.match(pickerAction, /!asset\.optimizedStorageKey/);
  assert.match(pickerAction, /!asset\.previewUrl/);
  assert.match(pickerAction, /!asset\.width/);
  assert.match(pickerAction, /!asset\.height/);
  assert.doesNotMatch(pickerAction, /media-public/);
});

test("Phase 12D saves Figure dependency links atomically with the draft", () => {
  assert.match(migration, /'figure'/);
  assert.match(migration, /media_usages_reader_figure_unique/);
  assert.match(migration, /usage_kind = 'reader_figure'/);
  assert.match(migration, /delete from public\.media_usages/);
  assert.match(migration, /insert into public\.media_usages/);
  assert.match(migration, /select distinct \(block ->> 'mediaId'\)::uuid/);
});

test("Phase 12D refuses unoptimized Figure assets and keeps them private", () => {
  assert.match(migration, /ma\.asset_state <> 'ready'/);
  assert.match(migration, /ma\.private_storage_key is null/);
  assert.match(migration, /ma\.optimized_storage_key is null/);
  assert.doesNotMatch(migration, /media-public/);
});

test("Phase 12D blocks Ready while Figure public promotion is deferred", () => {
  assert.match(editorForm, /readyBlockedByPrivateMedia/);
  assert.match(editorForm, /Choose Draft to save/);
  assert.match(migration, /private\.is_publishable_reader_document/);
  assert.doesNotMatch(migration, /create or replace function private\.is_publishable_reader_document/);
});
