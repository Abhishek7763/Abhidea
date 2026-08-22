"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildStudioDraftDocument,
  isStudioContentLocale,
  isStudioUuid,
  normalizeStudioDraftSlug,
  type StudioDraftCreateState,
} from "@/features/studio-content-model";
import { createStudioDraft, StudioContentRequestError } from "@/features/studio-content";

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
  if (title.length === 0 || title.length > 180) {
    fieldErrors.title = "Title must be between 1 and 180 characters.";
  }
  if (slug.length === 0) {
    fieldErrors.slug = "Add a slug or use a title that can generate one.";
  }
  if (summary.length > 1200) fieldErrors.summary = "Summary must be 1200 characters or fewer.";
  if (bodyText.length > 120000) fieldErrors.body = "Body is too large for this draft checkpoint.";
  if (subjectIds.length > 12 || subjectIds.some((subjectId) => !isStudioUuid(subjectId))) {
    fieldErrors.subjectIds = "Choose up to 12 valid subjects.";
  }

  if (Object.keys(fieldErrors).length > 0 || !isStudioContentLocale(locale)) {
    return {
      status: "error",
      message: "Fix the highlighted fields before saving the draft.",
      fieldErrors,
    };
  }

  try {
    await createStudioDraft({
      contentTypeId,
      locale,
      title,
      slug,
      summary,
      bodyJson: buildStudioDraftDocument(bodyText),
      subjectIds,
    });
  } catch (error) {
    if (error instanceof StudioContentRequestError && (error.status === 401 || error.status === 403)) {
      return {
        status: "error",
        message: "Your Studio session is no longer authorized. Reload this page and sign in again.",
        fieldErrors: {},
      };
    }

    return {
      status: "error",
      message: "Draft could not be saved. Content Type or Subjects may have changed. Refresh and try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/studio/content");
  redirect("/studio/content?created=1");
}
