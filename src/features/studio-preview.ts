import type { ReaderBlock } from "@/features/reader/document-schema";
import type { ReaderFixture } from "@/features/reader/reader-fixtures";
import type { StudioDraftEditorData, StudioEditionLink } from "@/features/studio-editor";

function blockText(block: ReaderBlock): string {
  switch (block.type) {
    case "paragraph":
    case "heading":
    case "quote":
    case "callout":
      return block.text;
    case "list":
      return block.items.join(" ");
    case "closure":
      return `${block.title} ${block.text}`;
    case "figure":
      return `${block.alt} ${block.caption ?? ""}`;
    case "divider":
      return "";
  }
}

export function estimateStudioPreviewMinutes(blocks: readonly ReaderBlock[]): number {
  const words = blocks
    .map(blockText)
    .join(" ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 190));
}

export function buildStudioPreviewEntry(
  draft: StudioDraftEditorData,
  editions: readonly StudioEditionLink[],
): Readonly<{
  entry: ReaderFixture | null;
  alternateLocalizationId: string | null;
}> {
  const alternateLocale = draft.locale === "en" ? "hi" : "en";
  const alternateEdition = editions.find((edition) => edition.locale === alternateLocale) ?? null;

  if (!draft.document.ok) {
    return {
      entry: null,
      alternateLocalizationId: alternateEdition?.localizationId ?? null,
    };
  }

  const bodyBlocks: ReaderBlock[] = draft.document.document.blocks.map((block) =>
    block.type === "list" ? { ...block, items: [...block.items] } : { ...block },
  );
  const minutes = estimateStudioPreviewMinutes(bodyBlocks);

  return {
    entry: {
      locale: draft.locale,
      slug: draft.slug || draft.localizationId,
      alternateLocale,
      alternateSlug: alternateEdition?.localizationId ?? "",
      title: draft.title || (draft.locale === "hi" ? "बिना शीर्षक ड्राफ्ट" : "Untitled draft"),
      summary: draft.summary,
      eyebrow: draft.locale === "hi" ? "निजी ड्राफ्ट पूर्वावलोकन" : "Private draft preview",
      contentType: draft.contentType.name,
      subjects: [],
      readingTime: draft.locale === "hi" ? `${minutes} मिनट पढ़ना` : `${minutes} min read`,
      body: {
        schemaVersion: 1,
        blocks: bodyBlocks,
      },
      sources: [],
      related: [],
    },
    alternateLocalizationId: alternateEdition?.localizationId ?? null,
  };
}
