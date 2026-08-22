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
