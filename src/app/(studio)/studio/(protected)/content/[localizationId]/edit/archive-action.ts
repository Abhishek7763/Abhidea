"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isStudioUuid } from "@/features/studio-content-model";
import {
  archiveStudioPublication,
  StudioPublicationRequestError,
} from "@/features/studio-publication";
import type { StudioPublishActionState } from "@/features/studio-publication-model";

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function archiveStudioPublicationAction(
  _previousState: StudioPublishActionState,
  formData: FormData,
): Promise<StudioPublishActionState> {
  const localizationId = formText(formData, "localizationId");
  const expectedRevisionId = formText(formData, "expectedRevisionId");
  const confirmed = formText(formData, "confirmArchive") === "yes";

  if (!isStudioUuid(localizationId) || !isStudioUuid(expectedRevisionId)) {
    return { status: "error", message: "Archive identity is stale or invalid. Reload before trying again." };
  }

  if (!confirmed) {
    return { status: "error", message: "Confirm that you want to remove this Reader page from public access." };
  }

  try {
    await archiveStudioPublication(localizationId, expectedRevisionId);
  } catch (error) {
    if (error instanceof StudioPublicationRequestError && error.code === "40001") {
      return { status: "conflict", message: "The live revision changed before archive completed. Reload and review the current live version." };
    }
    if (error instanceof StudioPublicationRequestError && error.code === "22023") {
      return { status: "error", message: "This edition is no longer in a publishable live state. Reload the page." };
    }
    if (error instanceof StudioPublicationRequestError && error.code === "P0002") {
      return { status: "error", message: "No live publication exists for this edition." };
    }
    if (error instanceof StudioPublicationRequestError && (error.status === 401 || error.status === 403)) {
      return { status: "error", message: "Your Studio session is no longer authorized to archive this publication. Sign in again." };
    }
    return { status: "error", message: "Archive did not complete. The current live state was left unchanged." };
  }

  revalidatePath("/studio/content");
  revalidatePath(`/studio/content/${localizationId}/edit`);
  revalidatePath(`/studio/content/${localizationId}/preview`);
  redirect(`/studio/content/${localizationId}/edit?archived=1`);
}
