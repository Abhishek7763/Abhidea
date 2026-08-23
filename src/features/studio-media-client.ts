"use client";

export const STUDIO_MEDIA_MAX_EDGE = 1920;
export const STUDIO_MEDIA_WEBP_QUALITY = 0.82;

export type OptimizedStudioMedia = Readonly<{
  blob: Blob;
  width: number;
  height: number;
}>;

export async function optimizeStudioMediaImage(source: Blob): Promise<OptimizedStudioMedia> {
  if (typeof createImageBitmap !== "function") {
    throw new Error("This browser cannot optimize images locally.");
  }

  const bitmap = await createImageBitmap(source);
  try {
    if (bitmap.width < 1 || bitmap.height < 1) {
      throw new Error("Image dimensions are invalid.");
    }

    const scale = Math.min(1, STUDIO_MEDIA_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("Canvas optimization is unavailable.");

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", STUDIO_MEDIA_WEBP_QUALITY);
    });

    if (!blob || blob.size < 1 || blob.type !== "image/webp") {
      throw new Error("WebP optimization failed in this browser.");
    }

    return { blob, width, height };
  } finally {
    bitmap.close();
  }
}

export async function uploadStudioMediaSignedVariant(
  signedUploadUrl: string,
  publishableKey: string,
  blob: Blob,
): Promise<Response> {
  const body = new FormData();
  body.append("cacheControl", "31536000");
  body.append("", blob, "main.webp");

  return fetch(signedUploadUrl, {
    method: "PUT",
    headers: {
      apikey: publishableKey,
      "x-upsert": "false",
    },
    body,
  });
}
