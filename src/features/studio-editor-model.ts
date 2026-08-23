import {
  parseReaderDocument,
  type ReaderBlock,
  type ReaderDocumentV1,
} from "@/features/reader/document-schema";

const MAX_EDITOR_JSON_CHARS = 250_000;
const MAX_EDITOR_BLOCKS = 300;

export type StudioEditableBlock = ReaderBlock;
export type StudioEditorBlockType = StudioEditableBlock["type"];

export type StudioEditableDocument = Readonly<{
  schemaVersion: 1;
  blocks: readonly StudioEditableBlock[];
}>;

export type StudioDraftUpdateState = Readonly<{
  status: "idle" | "error" | "conflict";
  message: string;
  fieldErrors: Readonly<Record<string, string>>;
}>;

export type StudioEditorDocumentParseResult =
  | Readonly<{ ok: true; document: StudioEditableDocument }>
  | Readonly<{ ok: false; message: string }>;

export const STUDIO_EDITOR_BLOCK_TYPES: readonly StudioEditorBlockType[] = [
  "paragraph",
  "heading",
  "quote",
  "list",
  "callout",
  "figure",
  "divider",
  "closure",
];

export function parseStudioEditorDocument(input: unknown): StudioEditorDocumentParseResult {
  const parsed = parseReaderDocument(input);

  if (!parsed.schemaSupported) {
    return { ok: false, message: "This draft does not use the supported ABHIDEA document schema." };
  }

  if (parsed.ignoredBlocks > 0) {
    return {
      ok: false,
      message: "This draft contains malformed or unknown blocks. Saving is blocked to prevent data loss.",
    };
  }

  if (parsed.document.blocks.length > MAX_EDITOR_BLOCKS) {
    return { ok: false, message: `This draft exceeds the ${MAX_EDITOR_BLOCKS}-block editor limit.` };
  }

  return {
    ok: true,
    document: {
      schemaVersion: 1,
      blocks: parsed.document.blocks,
    },
  };
}

export function parseStudioEditorDocumentJson(input: string): StudioEditorDocumentParseResult {
  if (input.length > MAX_EDITOR_JSON_CHARS) {
    return { ok: false, message: "The structured draft payload is too large for this editor checkpoint." };
  }

  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    return { ok: false, message: "The structured draft payload is not valid JSON." };
  }

  return parseStudioEditorDocument(value);
}

export function createStudioEditorBlock(
  type: StudioEditorBlockType,
  id: string,
): StudioEditableBlock {
  switch (type) {
    case "paragraph":
      return { id, type, text: "" };
    case "heading":
      return { id, type, level: 2, text: "" };
    case "quote":
      return { id, type, text: "" };
    case "list":
      return { id, type, style: "unordered", items: [""] };
    case "callout":
      return { id, type, tone: "note", text: "" };
    case "figure":
      return { id, type, mediaId: "", alt: "" };
    case "divider":
      return { id, type };
    case "closure":
      return { id, type, variant: "conclusion", title: "Conclusion", text: "" };
  }
}

export function serializeStudioEditorDocument(blocks: readonly StudioEditableBlock[]): string {
  const document: ReaderDocumentV1 = {
    schemaVersion: 1,
    blocks: [...blocks],
  };
  return JSON.stringify(document);
}
