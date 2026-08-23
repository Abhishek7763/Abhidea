import type {
  StudioRevisionBlockChange,
  StudioRevisionBlockSnapshot,
  StudioRevisionComparison,
  StudioRevisionFieldChange,
  StudioRevisionRecord,
} from "@/features/studio-publication-model";

type UnknownRecord = Record<string, unknown>;

type StudioComparableDraft = Readonly<{
  title: string;
  slug: string;
  summary: string;
  body: unknown;
}>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue);
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableJsonValue(value[key])]),
  );
}

function blockFingerprint(block: StudioRevisionBlockSnapshot): string {
  return JSON.stringify(stableJsonValue(block.payload));
}

function fieldChange(before: string, after: string): StudioRevisionFieldChange {
  return { changed: before !== after, before, after };
}

function parseDraftBlocks(body: unknown): readonly StudioRevisionBlockSnapshot[] | null {
  if (!isRecord(body) || body.schemaVersion !== 1 || !Array.isArray(body.blocks) || body.blocks.length > 300) {
    return null;
  }

  const usedIds = new Set<string>();
  const blocks: StudioRevisionBlockSnapshot[] = [];

  for (const item of body.blocks) {
    if (!isRecord(item)) return null;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    const type = typeof item.type === "string" ? item.type.trim() : "";
    if (!id || !type || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id) || usedIds.has(id)) return null;
    usedIds.add(id);
    blocks.push({ id, type, payload: item });
  }

  return blocks;
}

export function buildStudioLiveDraftComparison(
  liveRevision: StudioRevisionRecord,
  draft: StudioComparableDraft,
): StudioRevisionComparison | null {
  const draftBlocks = parseDraftBlocks(draft.body);
  if (!draftBlocks) return null;

  const liveBlocks = new Map(liveRevision.snapshot.body.blocks.map((block) => [block.id, block]));
  const nextBlocks = new Map(draftBlocks.map((block) => [block.id, block]));
  const added: StudioRevisionBlockSnapshot[] = [];
  const removed: StudioRevisionBlockSnapshot[] = [];
  const changed: StudioRevisionBlockChange[] = [];
  let unchangedCount = 0;

  for (const block of draftBlocks) {
    const previous = liveBlocks.get(block.id);
    if (!previous) {
      added.push(block);
    } else if (blockFingerprint(previous) !== blockFingerprint(block)) {
      changed.push({ id: block.id, beforeType: previous.type, afterType: block.type });
    } else {
      unchangedCount += 1;
    }
  }

  for (const block of liveRevision.snapshot.body.blocks) {
    if (!nextBlocks.has(block.id)) removed.push(block);
  }

  const title = fieldChange(liveRevision.snapshot.title, draft.title);
  const slug = fieldChange(liveRevision.snapshot.slug, draft.slug);
  const summary = fieldChange(liveRevision.snapshot.summary, draft.summary);
  const hasChanges =
    title.changed ||
    slug.changed ||
    summary.changed ||
    added.length > 0 ||
    removed.length > 0 ||
    changed.length > 0;

  return {
    hasChanges,
    title,
    slug,
    summary,
    subjects: {
      added: [],
      removed: [],
    },
    blocks: {
      beforeCount: liveRevision.snapshot.body.blocks.length,
      afterCount: draftBlocks.length,
      unchangedCount,
      added,
      removed,
      changed,
    },
  };
}
