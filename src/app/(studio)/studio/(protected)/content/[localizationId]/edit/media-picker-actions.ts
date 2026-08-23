"use server";

import {
  loadStudioMediaLibrary,
  StudioMediaRequestError,
} from "@/features/studio-media";

export type StudioEditorMediaPickerItem = Readonly<{
  id: string;
  filename: string;
  previewUrl: string;
  width: number;
  height: number;
  altText: string;
  caption: string;
  credit: string;
}>;

export type StudioEditorMediaPickerResult =
  | Readonly<{ ok: true; items: readonly StudioEditorMediaPickerItem[] }>
  | Readonly<{ ok: false; message: string }>;

export async function loadStudioEditorMediaPickerAction(): Promise<StudioEditorMediaPickerResult> {
  try {
    const library = await loadStudioMediaLibrary();
    const items = library.items.flatMap((asset) => {
      if (
        asset.assetState !== "ready" ||
        !asset.optimizedStorageKey ||
        !asset.previewUrl ||
        !asset.width ||
        !asset.height
      ) {
        return [];
      }

      return [{
        id: asset.id,
        filename: asset.originalFilename,
        previewUrl: asset.previewUrl,
        width: asset.width,
        height: asset.height,
        altText: asset.altText ?? "",
        caption: asset.caption ?? "",
        credit: asset.credit ?? "",
      } satisfies StudioEditorMediaPickerItem];
    });

    return { ok: true, items };
  } catch (error) {
    if (
      error instanceof StudioMediaRequestError &&
      (error.status === 401 || error.status === 403 || error.code === "42501")
    ) {
      return { ok: false, message: "Your Studio session is no longer authorized. Reload and sign in again." };
    }
    return { ok: false, message: "Media Library could not be loaded. Your draft is unchanged." };
  }
}
