export type StudioPublicationState = "published" | "archived";

export type StudioPublicationStatus = Readonly<{
  localizationId: string;
  revisionId: string;
  revisionNumber: number;
  slug: string;
  state: StudioPublicationState;
  publishedAt: string;
  updatedAt: string;
}>;

export type StudioPublishActionState = Readonly<{
  status: "idle" | "error" | "conflict";
  message: string;
}>;

export type StudioPublishResult = Readonly<{
  revisionId: string;
  revisionNumber: number;
  state: "published";
  publishedAt: string;
  lockVersion: number;
}>;

export type StudioPublishPreflight = Readonly<{
  ready: boolean;
  blockers: readonly string[];
}>;

export type StudioRevisionSubject = Readonly<{
  name: string;
  slug: string;
}>;

export type StudioRevisionBlockSnapshot = Readonly<{
  id: string;
  type: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type StudioRevisionSnapshot = Readonly<{
  schemaVersion: 1;
  contentId: string;
  localizationId: string;
  locale: "en" | "hi";
  contentType: Readonly<{
    id: string;
    name: string;
    slug: string;
  }>;
  title: string;
  slug: string;
  summary: string;
  body: Readonly<{
    schemaVersion: 1;
    blocks: readonly StudioRevisionBlockSnapshot[];
  }>;
  subjects: readonly StudioRevisionSubject[];
  editorialStatus: "ready";
}>;

export type StudioRevisionRecord = Readonly<{
  id: string;
  localizationId: string;
  revisionNumber: number;
  reason: string | null;
  createdAt: string;
  snapshot: StudioRevisionSnapshot;
}>;

export type StudioRevisionFieldChange = Readonly<{
  changed: boolean;
  before: string;
  after: string;
}>;

export type StudioRevisionBlockChange = Readonly<{
  id: string;
  beforeType: string;
  afterType: string;
}>;

export type StudioRevisionComparison = Readonly<{
  hasChanges: boolean;
  title: StudioRevisionFieldChange;
  slug: StudioRevisionFieldChange;
  summary: StudioRevisionFieldChange;
  subjects: Readonly<{
    added: readonly StudioRevisionSubject[];
    removed: readonly StudioRevisionSubject[];
  }>;
  blocks: Readonly<{
    beforeCount: number;
    afterCount: number;
    unchangedCount: number;
    added: readonly StudioRevisionBlockSnapshot[];
    removed: readonly StudioRevisionBlockSnapshot[];
    changed: readonly StudioRevisionBlockChange[];
  }>;
}>;

type StudioPublishPreflightInput = Readonly<{
  title: string;
  slug: string;
  summary: string;
  status: "draft" | "needs_review" | "ready";
  document: Readonly<{
    ok: boolean;
    document?: Readonly<{ blocks: readonly unknown[] }>;
  }>;
}>;

type UnknownRecord = Record<string, unknown>;

const REVISION_BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "quote",
  "list",
  "callout",
  "figure",
  "divider",
  "closure",
]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function plainString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function parseRevisionSubjects(value: unknown): readonly StudioRevisionSubject[] | null {
  if (!Array.isArray(value)) return null;

  const subjects: StudioRevisionSubject[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const name = requiredString(item.name);
    const slug = requiredString(item.slug);
    if (!name || !slug) return null;
    subjects.push({ name, slug });
  }
  return subjects;
}

function parseRevisionDocument(
  value: unknown,
): StudioRevisionSnapshot["body"] | null {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.blocks)) return null;
  if (value.blocks.length < 1 || value.blocks.length > 300) return null;

  const usedIds = new Set<string>();
  const blocks: StudioRevisionBlockSnapshot[] = [];

  for (const item of value.blocks) {
    if (!isRecord(item)) return null;
    const id = requiredString(item.id);
    const type = requiredString(item.type);
    if (!id || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id) || usedIds.has(id)) return null;
    if (!type || !REVISION_BLOCK_TYPES.has(type)) return null;
    usedIds.add(id);
    blocks.push({ id, type, payload: item });
  }

  return { schemaVersion: 1, blocks };
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

export function isStudioPublicationState(value: unknown): value is StudioPublicationState {
  return value === "published" || value === "archived";
}

export function studioPublicationStateLabel(state: StudioPublicationState): string {
  return state === "published" ? "Published" : "Archived";
}

export function studioRevisionReasonLabel(reason: string | null): string {
  if (reason === "publish") return "First publish";
  if (reason === "republish") return "Republish";
  return "Publication revision";
}

export function buildStudioPublishPreflight(input: StudioPublishPreflightInput): StudioPublishPreflight {
  const blockers: string[] = [];

  if (input.status !== "ready") blockers.push("Save the editorial state as Ready.");
  if (input.title.trim().length === 0 || input.title.trim().length > 180) {
    blockers.push("Add a valid title between 1 and 180 characters.");
  }
  if (input.slug.trim().length === 0 || input.slug.trim().length > 180) {
    blockers.push("Add a valid live slug.");
  }
  if (input.summary.length > 1200) blockers.push("Keep the summary within 1200 characters.");

  if (!input.document.ok) {
    blockers.push("Fix the saved structured body before publishing.");
  } else if (!input.document.document || input.document.document.blocks.length === 0) {
    blockers.push("Add at least one complete Reader block.");
  }

  return { ready: blockers.length === 0, blockers };
}

export function parseStudioPublicationRow(value: unknown): StudioPublicationStatus | null {
  if (!isRecord(value)) return null;

  const localizationId = requiredString(value.localization_id);
  const revisionId = requiredString(value.revision_id);
  const slug = requiredString(value.slug);
  const state = value.publication_state;
  const publishedAt = requiredString(value.published_at);
  const updatedAt = requiredString(value.updated_at);
  const revision = isRecord(value.content_revisions) ? value.content_revisions : null;
  const revisionNumber = revision ? positiveInteger(revision.revision_number) : null;

  if (
    !localizationId ||
    !revisionId ||
    !slug ||
    !isStudioPublicationState(state) ||
    !publishedAt ||
    !updatedAt ||
    !revisionNumber
  ) {
    return null;
  }

  return {
    localizationId,
    revisionId,
    revisionNumber,
    slug,
    state,
    publishedAt,
    updatedAt,
  };
}

export function parseStudioPublishResultRow(value: unknown): StudioPublishResult | null {
  if (!isRecord(value)) return null;

  const revisionId = requiredString(value.revision_id);
  const revisionNumber = positiveInteger(value.revision_number);
  const publishedAt = requiredString(value.published_at);
  const lockVersion = positiveInteger(value.lock_version);

  if (!revisionId || !revisionNumber || value.publication_state !== "published" || !publishedAt || !lockVersion) {
    return null;
  }

  return {
    revisionId,
    revisionNumber,
    state: "published",
    publishedAt,
    lockVersion,
  };
}

export function parseStudioRevisionRow(value: unknown): StudioRevisionRecord | null {
  if (!isRecord(value)) return null;

  const id = requiredString(value.id);
  const localizationId = requiredString(value.localization_id);
  const revisionNumber = positiveInteger(value.revision_number);
  const createdAt = requiredString(value.created_at);
  const reason = typeof value.reason === "string" && value.reason.trim() ? value.reason.trim() : null;
  const snapshot = isRecord(value.snapshot_json) ? value.snapshot_json : null;

  if (!id || !localizationId || !revisionNumber || !createdAt || !snapshot || snapshot.schemaVersion !== 1) {
    return null;
  }

  const contentId = requiredString(snapshot.contentId);
  const snapshotLocalizationId = requiredString(snapshot.localizationId);
  const locale = snapshot.locale === "en" || snapshot.locale === "hi" ? snapshot.locale : null;
  const contentType = isRecord(snapshot.contentType) ? snapshot.contentType : null;
  const contentTypeId = contentType ? requiredString(contentType.id) : null;
  const contentTypeName = contentType ? requiredString(contentType.name) : null;
  const contentTypeSlug = contentType ? requiredString(contentType.slug) : null;
  const title = requiredString(snapshot.title);
  const slug = requiredString(snapshot.slug);
  const summary = plainString(snapshot.summary);
  const body = parseRevisionDocument(snapshot.body);
  const subjects = parseRevisionSubjects(snapshot.subjects);

  if (
    !contentId ||
    !snapshotLocalizationId ||
    snapshotLocalizationId !== localizationId ||
    !locale ||
    !contentTypeId ||
    !contentTypeName ||
    !contentTypeSlug ||
    !title ||
    !slug ||
    summary === null ||
    !body ||
    !subjects ||
    snapshot.editorialStatus !== "ready"
  ) {
    return null;
  }

  return {
    id,
    localizationId,
    revisionNumber,
    reason,
    createdAt,
    snapshot: {
      schemaVersion: 1,
      contentId,
      localizationId,
      locale,
      contentType: {
        id: contentTypeId,
        name: contentTypeName,
        slug: contentTypeSlug,
      },
      title,
      slug,
      summary,
      body,
      subjects,
      editorialStatus: "ready",
    },
  };
}

export function buildStudioRevisionComparison(
  beforeRevision: StudioRevisionRecord,
  afterRevision: StudioRevisionRecord,
): StudioRevisionComparison {
  const beforeSubjects = new Map(beforeRevision.snapshot.subjects.map((subject) => [subject.slug, subject]));
  const afterSubjects = new Map(afterRevision.snapshot.subjects.map((subject) => [subject.slug, subject]));
  const addedSubjects = afterRevision.snapshot.subjects.filter((subject) => !beforeSubjects.has(subject.slug));
  const removedSubjects = beforeRevision.snapshot.subjects.filter((subject) => !afterSubjects.has(subject.slug));

  const beforeBlocks = new Map(beforeRevision.snapshot.body.blocks.map((block) => [block.id, block]));
  const afterBlocks = new Map(afterRevision.snapshot.body.blocks.map((block) => [block.id, block]));
  const addedBlocks: StudioRevisionBlockSnapshot[] = [];
  const removedBlocks: StudioRevisionBlockSnapshot[] = [];
  const changedBlocks: StudioRevisionBlockChange[] = [];
  let unchangedCount = 0;

  for (const block of afterRevision.snapshot.body.blocks) {
    const previous = beforeBlocks.get(block.id);
    if (!previous) {
      addedBlocks.push(block);
    } else if (blockFingerprint(previous) !== blockFingerprint(block)) {
      changedBlocks.push({ id: block.id, beforeType: previous.type, afterType: block.type });
    } else {
      unchangedCount += 1;
    }
  }

  for (const block of beforeRevision.snapshot.body.blocks) {
    if (!afterBlocks.has(block.id)) removedBlocks.push(block);
  }

  const title = fieldChange(beforeRevision.snapshot.title, afterRevision.snapshot.title);
  const slug = fieldChange(beforeRevision.snapshot.slug, afterRevision.snapshot.slug);
  const summary = fieldChange(beforeRevision.snapshot.summary, afterRevision.snapshot.summary);
  const hasChanges =
    title.changed ||
    slug.changed ||
    summary.changed ||
    addedSubjects.length > 0 ||
    removedSubjects.length > 0 ||
    addedBlocks.length > 0 ||
    removedBlocks.length > 0 ||
    changedBlocks.length > 0;

  return {
    hasChanges,
    title,
    slug,
    summary,
    subjects: {
      added: addedSubjects,
      removed: removedSubjects,
    },
    blocks: {
      beforeCount: beforeRevision.snapshot.body.blocks.length,
      afterCount: afterRevision.snapshot.body.blocks.length,
      unchangedCount,
      added: addedBlocks,
      removed: removedBlocks,
      changed: changedBlocks,
    },
  };
}
