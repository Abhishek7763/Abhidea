"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildStudioDraftDocument,
  isStudioContentLocale,
  isStudioEditorialStatus,
  isStudioUuid,
  normalizeStudioDraftSlug,
  type StudioDraftCreateState,
} from "@/features/studio-content-model";
import { createStudioDraft, StudioContentRequestError } from "@/features/studio-content";
import {
  parseStudioEditorDocumentJson,
  type StudioDraftUpdateState,
} from "@/features/studio-editor-model";
import {
  createStudioLinkedEdition,
  StudioEditorRequestError,
  updateStudioDraft,
} from "@/features/studio-editor";
import type { StudioPublishActionState } from "@/features/studio-publication-model";
import {
  publishStudioDraft,
  StudioPublicationRequestError,
} from "@/features/studio-publication";

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createStudioDraftAction(
  _previousState: StudioDraftCreateState,
  formData: FormData,
): Promise<StudioDraftCreateState> {
  const contentTypeId = formText(formData, "contentTypeId");
  const locale = formText(formData, "locale");
  const title = formText(formData, "title").trim();
  const rawSlug = formText(formData, "slug");
  const slug = normalizeStudioDraftSlug(rawSlug, title);
  const summary = formText(formData, "summary").trim();
  const bodyText = formText(formData, "body");
  const subjectIds = [
    ...new Set(
      formData
        .getAll("subjectIds")
        .filter((value): value is string => typeof value === "string"),
    ),
  ];

  const fieldErrors: Record<string, string> = {};

  if (!isStudioUuid(contentTypeId)) fieldErrors.contentTypeId = "Choose a valid content type.";
  if (!isStudioContentLocale(locale)) fieldErrors.locale = "Choose English or Hindi.";
  if (title.length === 0 || title.length > 180) fieldErrors.title = "Title must be between 1 and 180 characters.";
  if (slug.length === 0) fieldErrors.slug = "Add a slug or use a title that can generate one.";
  if (summary.length > 1200) fieldErrors.summary = "Summary must be 1200 characters or fewer.";
  if (bodyText.length > 120000) fieldErrors.body = "Body is too large for this draft checkpoint.";
  if (subjectIds.length > 12 || subjectIds.some((subjectId) => !isStudioUuid(subjectId))) {
    fieldErrors.subjectIds = "Choose up to 12 valid subjects.";
  }

  if (Object.keys(fieldErrors).length > 0 || !isStudioContentLocale(locale)) {
    return { status: "error", message: "Fix the highlighted fields before saving the draft.", fieldErrors };
  }

  try {
    await createStudioDraft({ contentTypeId, locale, title, slug, summary, bodyJson: buildStudioDraftDocument(bodyText), subjectIds });
  } catch (error) {
    if (error instanceof StudioContentRequestError && (error.status === 401 || error.status === 403)) {
      return { status: "error", message: "Your Studio session is no longer authorized. Reload this page and sign in again.", fieldErrors: {} };
    }
    return { status: "error", message: "Draft could not be saved. Content Type or Subjects may have changed. Refresh and try again.", fieldErrors: {} };
  }

  revalidatePath("/studio/content");
  redirect("/studio/content?created=1");
}

export async function createStudioLinkedEditionAction(
  _previousState: StudioDraftCreateState,
  formData: FormData,
): Promise<StudioDraftCreateState> {
  const sourceLocalizationId = formText(formData, "sourceLocalizationId");
  const locale = formText(formData, "locale");
  const title = formText(formData, "title").trim();
  const slug = normalizeStudioDraftSlug(formText(formData, "slug"), title);
  const summary = formText(formData, "summary").trim();
  const bodyText = formText(formData, "body");
  const fieldErrors: Record<string, string> = {};

  if (!isStudioUuid(sourceLocalizationId)) fieldErrors.sourceLocalizationId = "Source edition identity is invalid.";
  if (!isStudioContentLocale(locale)) fieldErrors.locale = "Choose English or Hindi.";
  if (title.length === 0 || title.length > 180) fieldErrors.title = "Title must be between 1 and 180 characters.";
  if (slug.length === 0) fieldErrors.slug = "Add a slug or use a title that can generate one.";
  if (summary.length > 1200) fieldErrors.summary = "Summary must be 1200 characters or fewer.";
  if (bodyText.length > 120000) fieldErrors.body = "Body is too large for this draft checkpoint.";

  if (Object.keys(fieldErrors).length > 0 || !isStudioContentLocale(locale)) {
    return { status: "error", message: "Fix the highlighted fields before creating the linked edition.", fieldErrors };
  }

  let localizationId: string;
  try {
    const result = await createStudioLinkedEdition({ sourceLocalizationId, locale, title, slug, summary, bodyJson: buildStudioDraftDocument(bodyText) });
    localizationId = result.localizationId;
  } catch (error) {
    if (error instanceof StudioEditorRequestError && error.code === "23505") {
      return { status: "error", message: "That language edition already exists. Return to the source draft and open the existing edition.", fieldErrors: {} };
    }
    if (error instanceof StudioEditorRequestError && (error.status === 401 || error.status === 403)) {
      return { status: "error", message: "Your Studio session is no longer authorized. Reload and sign in again.", fieldErrors: {} };
    }
    return { status: "error", message: "Linked edition could not be created. The source edition remains unchanged.", fieldErrors: {} };
  }

  revalidatePath("/studio/content");
  redirect(`/studio/content/${localizationId}/edit?linked=1`);
}

export async function updateStudioDraftAction(
  _previousState: StudioDraftUpdateState,
  formData: FormData,
): Promise<StudioDraftUpdateState> {
  const localizationId = formText(formData, "localizationId");
  const expectedLockVersion = Number(formText(formData, "expectedLockVersion"));
  const title = formText(formData, "title").trim();
  const slug = normalizeStudioDraftSlug(formText(formData, "slug"), title);
  const summary = formText(formData, "summary").trim();
  const editorialStatus = formText(formData, "editorialStatus");
  const documentJson = formText(formData, "documentJson");
  const fieldErrors: Record<string, string> = {};

  if (!isStudioUuid(localizationId)) fieldErrors.localizationId = "Draft identity is invalid.";
  if (!Number.isSafeInteger(expectedLockVersion) || expectedLockVersion < 1) fieldErrors.expectedLockVersion = "Draft version is invalid. Reload before saving.";
  if (title.length === 0 || title.length > 180) fieldErrors.title = "Title must be between 1 and 180 characters.";
  if (slug.length === 0) fieldErrors.slug = "Slug cannot be empty.";
  if (summary.length > 1200) fieldErrors.summary = "Summary must be 1200 characters or fewer.";
  if (!isStudioEditorialStatus(editorialStatus)) fieldErrors.editorialStatus = "Choose a valid editorial state.";

  const parsedDocument = parseStudioEditorDocumentJson(documentJson);
  if (!parsedDocument.ok) fieldErrors.documentJson = parsedDocument.message;
  if (editorialStatus === "ready" && parsedDocument.ok && parsedDocument.document.blocks.length === 0) {
    fieldErrors.editorialStatus = "Ready drafts need at least one complete body block.";
  }

  if (Object.keys(fieldErrors).length > 0 || !parsedDocument.ok || !isStudioEditorialStatus(editorialStatus)) {
    return { status: "error", message: "Fix the highlighted draft fields before saving.", fieldErrors };
  }

  try {
    await updateStudioDraft({ localizationId, expectedLockVersion, title, slug, summary, bodyJson: parsedDocument.document, editorialStatus });
  } catch (error) {
    if (error instanceof StudioEditorRequestError && error.code === "40001") {
      return { status: "conflict", message: "This draft changed after you opened it. Reload the page before saving so newer work is not overwritten.", fieldErrors: {} };
    }
    if (error instanceof StudioEditorRequestError && (error.status === 401 || error.status === 403)) {
      return { status: "error", message: "Your Studio session is no longer authorized. Reload and sign in again.", fieldErrors: {} };
    }
    return { status: "error", message: "Draft could not be saved. The stored version remains unchanged; reload and try again.", fieldErrors: {} };
  }

  revalidatePath("/studio/content");
  revalidatePath(`/studio/content/${localizationId}/edit`);
  redirect(`/studio/content/${localizationId}/edit?saved=1`);
}

export async function publishStudioDraftAction(
  _previousState: StudioPublishActionState,
  formData: FormData,
): Promise<StudioPublishActionState> {
  const localizationId = formText(formData, "localizationId");
  const expectedLockVersion = Number(formText(formData, "expectedLockVersion"));

  if (!isStudioUuid(localizationId) || !Number.isSafeInteger(expectedLockVersion) || expectedLockVersion < 1) {
    return { status: "error", message: "Publish identity is stale or invalid. Reload the draft before publishing." };
  }

  try {
    await publishStudioDraft(localizationId, expectedLockVersion);
  } catch (error) {
    if (error instanceof StudioPublicationRequestError && error.code === "40001") {
      return { status: "conflict", message: "This draft changed before publish completed. Reload before trying again." };
    }
    if (error instanceof StudioPublicationRequestError && error.code === "23505") {
      return { status: "error", message: "This language slug is already live on another edition. Change the slug, save, then retry." };
    }
    if (error instanceof StudioPublicationRequestError && error.code === "22023") {
      return { status: "error", message: "Publish preflight failed. Reload, fix the saved draft, mark it Ready, and retry." };
    }
    if (error instanceof StudioPublicationRequestError && (error.status === 401 || error.status === 403)) {
      return { status: "error", message: "Your Studio session is no longer authorized to publish. Sign in again." };
    }
    return { status: "error", message: "Publish did not complete. No partial revision or live snapshot was kept." };
  }

  revalidatePath("/studio/content");
  revalidatePath(`/studio/content/${localizationId}/edit`);
  revalidatePath(`/studio/content/${localizationId}/preview`);
  redirect(`/studio/content/${localizationId}/edit?published=1`);
}
