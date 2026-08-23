import { cookies } from "next/headers";

import { isStudioContentLocale, type StudioContentLocale } from "@/features/studio-content-model";

const ACCESS_COOKIE = "abhidea-studio-access";
const ACTIVITY_LIMIT = 200;

export const studioActivityTypes = [
  "draft_created",
  "draft_saved",
  "published",
  "republished",
  "archived",
  "trashed",
  "restored",
] as const;

export type StudioActivityType = (typeof studioActivityTypes)[number];
export type StudioActivityCategory = "all" | "writing" | "publishing" | "lifecycle";

export type StudioActivityEvent = Readonly<{
  id: string;
  localizationId: string;
  contentId: string;
  eventType: StudioActivityType;
  actorEmail: string | null;
  locale: StudioContentLocale;
  title: string;
  slug: string;
  metadata: Readonly<Record<string, unknown>>;
  occurredAt: string;
}>;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isStudioActivityType(value: unknown): value is StudioActivityType {
  return typeof value === "string" && (studioActivityTypes as readonly string[]).includes(value);
}

function parseActivityEvent(value: unknown): StudioActivityEvent | null {
  if (!isRecord(value)) return null;

  const id = requiredString(value.id);
  const localizationId = requiredString(value.localization_id);
  const contentId = requiredString(value.content_id);
  const eventType = value.event_type;
  const locale = value.locale;
  const occurredAt = requiredString(value.occurred_at);

  if (
    !id ||
    !localizationId ||
    !contentId ||
    !isStudioActivityType(eventType) ||
    !isStudioContentLocale(locale) ||
    !occurredAt
  ) {
    return null;
  }

  return {
    id,
    localizationId,
    contentId,
    eventType,
    actorEmail: typeof value.actor_email === "string" && value.actor_email.length > 0 ? value.actor_email : null,
    locale,
    title: stringValue(value.title),
    slug: stringValue(value.slug),
    metadata: isRecord(value.metadata) ? value.metadata : {},
    occurredAt,
  };
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Studio activity configuration is unavailable.");
  return { url, publishableKey };
}

async function getStudioAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) throw new Error("Studio session token is unavailable.");
  return accessToken;
}

export async function loadStudioActivityEvents(): Promise<readonly StudioActivityEvent[]> {
  const { url, publishableKey } = getSupabaseConfig();
  const accessToken = await getStudioAccessToken();
  const endpoint = new URL(`${url}/rest/v1/studio_activity_events`);
  endpoint.searchParams.set(
    "select",
    "id,localization_id,content_id,event_type,actor_email,locale,title,slug,metadata,occurred_at",
  );
  endpoint.searchParams.set("order", "occurred_at.desc,id.desc");
  endpoint.searchParams.set("limit", String(ACTIVITY_LIMIT));

  const response = await fetch(endpoint, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Studio activity request failed with status ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error("Studio activity returned an invalid payload.");

  return payload.map(parseActivityEvent).filter((event): event is StudioActivityEvent => event !== null);
}

export function normalizeStudioActivityCategory(value: string | string[] | undefined): StudioActivityCategory {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "writing" || candidate === "publishing" || candidate === "lifecycle" ? candidate : "all";
}

export function filterStudioActivityEvents(
  events: readonly StudioActivityEvent[],
  category: StudioActivityCategory,
): StudioActivityEvent[] {
  if (category === "all") return [...events];
  if (category === "writing") {
    return events.filter((event) => event.eventType === "draft_created" || event.eventType === "draft_saved");
  }
  if (category === "publishing") {
    return events.filter((event) => ["published", "republished", "archived"].includes(event.eventType));
  }
  return events.filter((event) => event.eventType === "trashed" || event.eventType === "restored");
}

export function studioActivityLabel(type: StudioActivityType): string {
  switch (type) {
    case "draft_created":
      return "Draft created";
    case "draft_saved":
      return "Draft saved";
    case "published":
      return "Published";
    case "republished":
      return "Republished";
    case "archived":
      return "Archived";
    case "trashed":
      return "Moved to Trash";
    case "restored":
      return "Restored";
  }
}

function metadataNumber(metadata: Readonly<Record<string, unknown>>, key: string): number | null {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function metadataString(metadata: Readonly<Record<string, unknown>>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function studioActivityDetail(event: StudioActivityEvent): string {
  if (event.eventType === "draft_created") return "Private working draft created.";
  if (event.eventType === "draft_saved") {
    const status = metadataString(event.metadata, "toStatus");
    return status ? `Private draft saved as ${status.replaceAll("_", " ")}.` : "Private working draft saved.";
  }
  if (event.eventType === "published" || event.eventType === "republished") {
    const revision = metadataNumber(event.metadata, "revisionNumber");
    return revision ? `Immutable Revision ${revision} became the public Reader snapshot.` : "A new immutable revision became public.";
  }
  if (event.eventType === "archived") return "Public Reader access was removed while history stayed preserved.";
  if (event.eventType === "trashed") return "Localized edition moved to reversible Trash.";
  return "Localized edition restored to the active Studio library without auto-publishing.";
}
