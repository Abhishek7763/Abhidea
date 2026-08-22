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

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function isStudioPublicationState(value: unknown): value is StudioPublicationState {
  return value === "published" || value === "archived";
}

export function studioPublicationStateLabel(state: StudioPublicationState): string {
  return state === "published" ? "Published" : "Archived";
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
