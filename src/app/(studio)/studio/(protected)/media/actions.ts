"use server";

import { revalidatePath } from "next/cache";

import { isStudioUuid } from "@/features/studio-content-model";
import {
  cancelStudioMediaUpload,
  finalizeStudioMediaUpload,
  reserveStudioMediaUpload,
  StudioMediaRequestError,
  updateStudioMediaMetadata,
  type StudioMediaUploadReservation,
} from "@/features/studio-media";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type StudioMediaUploadActionResult =
  | Readonly<{ ok: true; reservation: StudioMediaUploadReservation }>
  | Readonly<{ ok: false; message: string }>;

export type StudioMediaSimpleActionResult = Readonly<{
  ok: boolean;
  message: string;
}>;

export type StudioMediaMetadataActionState = Readonly<{
  status: "idle" | "success" | "error";
  message: string;
}>;

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function requestErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof StudioMediaRequestError) {
    if (error.status === 401 || error.status === 403 || error.code === "42501") {
      return "Your Studio session is no longer authorized. Reload and sign in again.";
    }
    if (error.code === "22023") return "Media details or upload state are invalid. Refresh and try again.";
  }
  return fallback;
}

export async function reserveStudioMediaUploadAction(input: {
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  altText: string;
  caption: string;
  credit: string;
  sourceUrl: string;
}): Promise<StudioMediaUploadActionResult> {
  const originalFilename = textValue(input.originalFilename);
  const mimeType = textValue(input.mimeType);
  const altText = textValue(input.altText);
  const caption = textValue(input.caption);
  const credit = textValue(input.credit);
  const sourceUrl = textValue(input.sourceUrl);

  if (originalFilename.length < 1 || originalFilename.length > 500) {
    return { ok: false, message: "Choose an image with a valid filename." };
  }
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    return { ok: false, message: "Only JPEG, PNG, WebP and AVIF images are supported." };
  }
  if (!Number.isSafeInteger(input.byteSize) || input.byteSize < 1 || input.byteSize > MAX_IMAGE_BYTES) {
    return { ok: false, message: "Image must be 10 MiB or smaller." };
  }
  if (altText.length > 500 || caption.length > 2000 || credit.length > 500) {
    return { ok: false, message: "Media metadata is too long. Shorten the highlighted text and retry." };
  }
  if (!validHttpUrl(sourceUrl)) {
    return { ok: false, message: "Source URL must start with http:// or https://." };
  }

  try {
    const reservation = await reserveStudioMediaUpload({
      originalFilename,
      mimeType,
      byteSize: input.byteSize,
      altText,
      caption,
      credit,
      sourceUrl,
    });
    return { ok: true, reservation };
  } catch (error) {
    return {
      ok: false,
      message: requestErrorMessage(error, "A private upload ticket could not be created. Nothing was published."),
    };
  }
}

export async function finalizeStudioMediaUploadAction(
  mediaId: string,
  storageKey: string,
): Promise<StudioMediaSimpleActionResult> {
  if (!isStudioUuid(mediaId) || !storageKey.startsWith("uploads/")) {
    return { ok: false, message: "Upload identity is invalid. Start the upload again." };
  }

  try {
    await finalizeStudioMediaUpload(mediaId, storageKey);
    revalidatePath("/studio/media");
    revalidatePath(`/studio/media/${mediaId}`);
    return { ok: true, message: "Image uploaded and saved to the private Media Library." };
  } catch (error) {
    return {
      ok: false,
      message: requestErrorMessage(error, "The file uploaded, but Media finalization failed. Cleanup will be attempted."),
    };
  }
}

export async function cancelStudioMediaUploadAction(
  mediaId: string,
  storageKey: string,
): Promise<StudioMediaSimpleActionResult> {
  if (!isStudioUuid(mediaId)) return { ok: false, message: "Upload cleanup identity is invalid." };

  try {
    await cancelStudioMediaUpload(mediaId, storageKey || undefined);
    revalidatePath("/studio/media");
    return { ok: true, message: "Failed upload reservation cleaned up." };
  } catch (error) {
    return {
      ok: false,
      message: requestErrorMessage(error, "Automatic cleanup could not be completed. The staged record was left intact for safe recovery."),
    };
  }
}

export async function updateStudioMediaMetadataAction(
  _previousState: StudioMediaMetadataActionState,
  formData: FormData,
): Promise<StudioMediaMetadataActionState> {
  const mediaId = textValue(formData.get("mediaId"));
  const altText = textValue(formData.get("altText"));
  const caption = textValue(formData.get("caption"));
  const credit = textValue(formData.get("credit"));
  const sourceUrl = textValue(formData.get("sourceUrl"));

  if (!isStudioUuid(mediaId)) return { status: "error", message: "Media identity is invalid." };
  if (altText.length > 500 || caption.length > 2000 || credit.length > 500) {
    return { status: "error", message: "Metadata is too long. Shorten it before saving." };
  }
  if (!validHttpUrl(sourceUrl)) {
    return { status: "error", message: "Source URL must start with http:// or https://." };
  }

  try {
    await updateStudioMediaMetadata({ mediaId, altText, caption, credit, sourceUrl });
  } catch (error) {
    return {
      status: "error",
      message: requestErrorMessage(error, "Media metadata could not be saved. The existing metadata is unchanged."),
    };
  }

  revalidatePath("/studio/media");
  revalidatePath(`/studio/media/${mediaId}`);
  return { status: "success", message: "Media metadata saved." };
}
