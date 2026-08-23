"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isStudioUuid } from "@/features/studio-content-model";
import type { StudioPublishActionState } from "@/features/studio-publication-model";
import {
  restoreStudioLocalization,
  StudioTrashRequestError,
  trashStudioLocalization,
} from "@/features/studio-trash";

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function parseLockVersion(value: string): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function trashStudioLocalizationAction(
  _previousState: StudioPublishActionState,
  formData: FormData,
): Promise<StudioPublishActionState> {
  const localizationId = formText(formData, "localizationId");
  const expectedLockVersion = parseLockVersion(formText(formData, "expectedLockVersion"));
  const expectedLiveRevisionIdValue = formText(formData, "expectedLiveRevisionId");
  const expectedLiveRevisionId = expectedLiveRevisionIdValue || null;
  const confirmed = formText(formData, "confirmTrash") === "yes";

  if (
    !isStudioUuid(localizationId) ||
    !expectedLockVersion ||
    (expectedLiveRevisionId !== null && !isStudioUuid(expectedLiveRevisionId))
  ) {
    return { status: "error", message: "Trash identity is stale or invalid. Reload before trying again." };
  }

  if (!confirmed) {
    return { status: "error", message: "Confirm that you want to move this language edition to Trash." };
  }

  try {
    await trashStudioLocalization(localizationId, expectedLockVersion, expectedLiveRevisionId);
  } catch (error) {
    if (error instanceof StudioTrashRequestError && error.code === "40001") {
      return { status: "conflict", message: "This draft or publication changed before Trash completed. Reload and review the current state." };
    }
    if (error instanceof StudioTrashRequestError && error.code === "22023") {
      return { status: "error", message: "This edition is already in Trash or its lifecycle changed. Reload the page." };
    }
    if (error instanceof StudioTrashRequestError && error.code === "P0002") {
      return { status: "error", message: "This localized draft no longer exists." };
    }
    if (error instanceof StudioTrashRequestError && (error.status === 401 || error.status === 403)) {
      return { status: "error", message: "Your Studio session is no longer authorized to use Trash. Sign in again." };
    }
    return { status: "error", message: "Trash did not complete. The current draft and publication state were left unchanged." };
  }

  revalidatePath("/studio/content");
  revalidatePath("/studio/content/trash");
  revalidatePath(`/studio/content/${localizationId}/edit`);
  revalidatePath(`/studio/content/${localizationId}/preview`);
  redirect("/studio/content/trash?trashed=1");
}

export async function restoreStudioLocalizationAction(
  _previousState: StudioPublishActionState,
  formData: FormData,
): Promise<StudioPublishActionState> {
  const localizationId = formText(formData, "localizationId");
  const expectedLockVersion = parseLockVersion(formText(formData, "expectedLockVersion"));

  if (!isStudioUuid(localizationId) || !expectedLockVersion) {
    return { status: "error", message: "Restore identity is stale or invalid. Reload Trash before trying again." };
  }

  try {
    await restoreStudioLocalization(localizationId, expectedLockVersion);
  } catch (error) {
    if (error instanceof StudioTrashRequestError && error.code === "40001") {
      return { status: "conflict", message: "This draft changed before Restore completed. Reload Trash and try again." };
    }
    if (error instanceof StudioTrashRequestError && error.code === "22023") {
      return { status: "error", message: "This edition is no longer in Trash. Reload the page." };
    }
    if (error instanceof StudioTrashRequestError && error.code === "P0002") {
      return { status: "error", message: "This localized draft no longer exists." };
    }
    if (error instanceof StudioTrashRequestError && (error.status === 401 || error.status === 403)) {
      return { status: "error", message: "Your Studio session is no longer authorized to restore this edition. Sign in again." };
    }
    return { status: "error", message: "Restore did not complete. The edition remains safely in Trash." };
  }

  revalidatePath("/studio/content");
  revalidatePath("/studio/content/trash");
  revalidatePath(`/studio/content/${localizationId}/edit`);
  redirect(`/studio/content?restored=1`);
}
