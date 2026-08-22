export const READER_SCHEMA_VERSION = 1 as const;

export type ReaderLocale = "en" | "hi";

export type ParagraphBlock = {
  id: string;
  type: "paragraph";
  text: string;
};

export type HeadingBlock = {
  id: string;
  type: "heading";
  level: 2 | 3;
  text: string;
};

export type QuoteBlock = {
  id: string;
  type: "quote";
  text: string;
  attribution?: string;
};

export type ListBlock = {
  id: string;
  type: "list";
  style: "ordered" | "unordered";
  items: string[];
};

export type CalloutBlock = {
  id: string;
  type: "callout";
  tone: "note" | "key-idea" | "warning";
  title?: string;
  text: string;
};

export type FigureBlock = {
  id: string;
  type: "figure";
  mediaId: string;
  alt: string;
  caption?: string;
  credit?: string;
};

export type DividerBlock = {
  id: string;
  type: "divider";
};

export type ClosureBlock = {
  id: string;
  type: "closure";
  variant: "abhidea-take" | "conclusion";
  title: string;
  text: string;
};

export type ReaderBlock =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | ListBlock
  | CalloutBlock
  | FigureBlock
  | DividerBlock
  | ClosureBlock;

export type ReaderDocumentV1 = {
  schemaVersion: typeof READER_SCHEMA_VERSION;
  blocks: ReaderBlock[];
};

export type ParsedReaderDocument = {
  document: ReaderDocumentV1;
  ignoredBlocks: number;
  schemaSupported: boolean;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function safeId(value: unknown, index: number): string {
  if (typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(value)) {
    return value;
  }
  return `block-${index + 1}`;
}

function parseBlock(value: unknown, index: number): ReaderBlock | null {
  if (!isRecord(value) || typeof value.type !== "string") return null;

  const id = safeId(value.id, index);

  switch (value.type) {
    case "paragraph": {
      const text = requiredString(value.text);
      return text ? { id, type: "paragraph", text } : null;
    }
    case "heading": {
      const text = requiredString(value.text);
      const level = value.level === 3 ? 3 : value.level === 2 ? 2 : null;
      return text && level ? { id, type: "heading", level, text } : null;
    }
    case "quote": {
      const text = requiredString(value.text);
      return text
        ? { id, type: "quote", text, attribution: optionalString(value.attribution) }
        : null;
    }
    case "list": {
      if (!Array.isArray(value.items)) return null;
      const items = value.items
        .map(requiredString)
        .filter((item): item is string => item !== null);
      if (items.length === 0) return null;
      const style = value.style === "ordered" ? "ordered" : value.style === "unordered" ? "unordered" : null;
      return style ? { id, type: "list", style, items } : null;
    }
    case "callout": {
      const text = requiredString(value.text);
      const tone = value.tone === "key-idea" || value.tone === "warning" || value.tone === "note"
        ? value.tone
        : null;
      return text && tone
        ? { id, type: "callout", tone, title: optionalString(value.title), text }
        : null;
    }
    case "figure": {
      const mediaId = requiredString(value.mediaId);
      const alt = requiredString(value.alt);
      return mediaId && alt
        ? {
            id,
            type: "figure",
            mediaId,
            alt,
            caption: optionalString(value.caption),
            credit: optionalString(value.credit),
          }
        : null;
    }
    case "divider":
      return { id, type: "divider" };
    case "closure": {
      const title = requiredString(value.title);
      const text = requiredString(value.text);
      const variant = value.variant === "abhidea-take" || value.variant === "conclusion" ? value.variant : null;
      return title && text && variant ? { id, type: "closure", variant, title, text } : null;
    }
    default:
      return null;
  }
}

export function parseReaderDocument(input: unknown): ParsedReaderDocument {
  if (!isRecord(input) || input.schemaVersion !== READER_SCHEMA_VERSION || !Array.isArray(input.blocks)) {
    return {
      document: { schemaVersion: READER_SCHEMA_VERSION, blocks: [] },
      ignoredBlocks: 0,
      schemaSupported: false,
    };
  }

  const parsedBlocks: ReaderBlock[] = [];
  const usedIds = new Set<string>();
  let ignoredBlocks = 0;

  input.blocks.forEach((block, index) => {
    const parsed = parseBlock(block, index);
    if (!parsed) {
      ignoredBlocks += 1;
      return;
    }

    const baseId = parsed.id;
    let uniqueId = baseId;
    let suffix = 2;

    while (usedIds.has(uniqueId)) {
      uniqueId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(uniqueId);
    parsedBlocks.push(uniqueId === parsed.id ? parsed : { ...parsed, id: uniqueId });
  });

  return {
    document: { schemaVersion: READER_SCHEMA_VERSION, blocks: parsedBlocks },
    ignoredBlocks,
    schemaSupported: true,
  };
}

export type TableOfContentsItem = {
  id: string;
  level: 2 | 3;
  text: string;
};

export function getTableOfContents(input: unknown): TableOfContentsItem[] {
  const { document } = parseReaderDocument(input);
  return document.blocks
    .filter((block): block is HeadingBlock => block.type === "heading")
    .map((block) => ({ id: `section-${block.id}`, level: block.level, text: block.text }));
}
