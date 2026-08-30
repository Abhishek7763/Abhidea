import { cookies } from "next/headers";

import {
  parseStudioPublicationRow,
  parseStudioPublishResultRow,
  parseStudioRevisionRow,
  type StudioPublicationStatus,
  type StudioPublishResult,
  type StudioRevisionRecord,
} from "@/features/studio-publication-model";

const ACCESS_COOKIE = "abhidea-studio-access";
const REVISION_HISTORY_LIMIT = 100;

type UnknownRecord = Record<string, unknown>;

type StudioMediaPromotionPlan = Readonly<{
  mediaId: string;
  sourceStorageKey: string;
  publicStorageKey: string;
  objectExists: boolean;
  finalized: boolean;
}>;

export class StudioPublicationRequestError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "StudioPublicationRequestError";
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) throw new Error("Studio publication configuration is unavailable.");
  return { url, publishableKey };
}

async function getStudioAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) throw new Error("Studio session token is unavailable.");
  return accessToken;
}

function parseRequestErrorPayload(payload: unknown, status: number, fallback: string): StudioPublicationRequestError {
  const code = isRecord(payload) && typeof payload.code === "string" ? payload.code : undefined;
  const message =
    isRecord(payload) && typeof payload.message === "string"
      ? payload.message
      : fallback;
  return new StudioPublicationRequestError(message, status, code);
}

async function requestPublicationJson(endpoint: URL, init: RequestInit = {}): Promise<unknown> {
  const { publishableKey } = getSupabaseConfig();
  const accessToken = await getStudioAccessToken();
  const response = await fetch(endpoint, {
    ...init,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw parseRequestErrorPayload(
      payload,
      response.status,
      `Studio publication request failed with status ${response.status}.`,
    );
  }

  return payload;
}

function parseMediaPromotionPlan(value: unknown): StudioMediaPromotionPlan | null {
  if (!isRecord(value)) return null;
  const mediaId = requiredString(value.media_id);
  const sourceStorageKey = requiredString(value.source_storage_key);
  const publicStorageKey = requiredString(value.public_storage_key);
  if (!mediaId || !sourceStorageKey || !publicStorageKey) return null;
  if (typeof value.object_exists !== "boolean" || typeof value.finalized !== "boolean") return null;
  return {
    mediaId,
    sourceStorageKey,
    publicStorageKey,
    objectExists: value.object_exists,
    finalized: value.finalized,
  };
}

async function copyReaderMediaObject(plan: StudioMediaPromotionPlan): Promise<void> {
  const config = getSupabaseConfig();
  const accessToken = await getStudioAccessToken();
  const response = await fetch(`${config.url}/storage/v1/object/copy`, {
    method: "POST",
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-upsert": "false",
    },
    body: JSON.stringify({
      bucketId: "media-private",
      sourceKey: plan.sourceStorageKey,
      destinationKey: plan.publicStorageKey,
      destinationBucket: "media-public",
    }),
    cache: "no-store",
  });

  if (response.ok) return;

  const payload: unknown = await response.json().catch(() => null);
  const code = isRecord(payload) && typeof payload.code === "string" ? payload.code : "";
  const message = isRecord(payload) && typeof payload.message === "string" ? payload.message : "";
  if (response.status === 409 || code === "Duplicate" || /already exists|duplicate/i.test(message)) {
    return;
  }

  throw parseRequestErrorPayload(
    payload,
    response.status,
    "Optimized Reader media could not be copied into public Storage.",
  );
}

export async function promoteStudioDraftReaderMedia(
  localizationId: string,
  expectedLockVersion: number,
): Promise<void> {
  const { url } = getSupabaseConfig();
  const prepareEndpoint = new URL(`${url}/rest/v1/rpc/prepare_reader_media_promotion`);
  const payload = await requestPublicationJson(prepareEndpoint, {
    method: "POST",
    body: JSON.stringify({
      p_localization_id: localizationId,
      p_expected_lock_version: expectedLockVersion,
    }),
  });

  if (!Array.isArray(payload)) {
    throw new Error("Reader media promotion returned an invalid plan payload.");
  }

  const plans = payload.map(parseMediaPromotionPlan);
  if (plans.some((plan) => plan === null)) {
    throw new Error("Reader media promotion returned an incomplete plan.");
  }

  for (const plan of plans as StudioMediaPromotionPlan[]) {
    if (plan.finalized) continue;
    if (!plan.objectExists) await copyReaderMediaObject(plan);

    const finalizeEndpoint = new URL(`${url}/rest/v1/rpc/finalize_reader_media_promotion`);
    await requestPublicationJson(finalizeEndpoint, {
      method: "POST",
      body: JSON.stringify({
        p_media_id: plan.mediaId,
        p_public_storage_key: plan.publicStorageKey,
      }),
    });
  }
}

export async function loadStudioPublicationStatus(
  localizationId: string,
): Promise<StudioPublicationStatus | null> {
  const { url } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/published_localizations`);
  endpoint.searchParams.set(
    "select",
    "localization_id,revision_id,slug,publication_state,published_at,updated_at,content_revisions!inner(revision_number)",
  );
  endpoint.searchParams.set("localization_id", `eq.${localizationId}`);
  endpoint.searchParams.set("limit", "1");

  const payload = await requestPublicationJson(endpoint);
  if (!Array.isArray(payload)) throw new Error("Studio publication returned an invalid row payload.");
  if (payload.length === 0) return null;

  const status = parseStudioPublicationRow(payload[0]);
  if (!status) throw new Error("Studio publication returned an invalid publication payload.");
  return status;
}

export async function loadStudioRevisionHistory(localizationId: string): Promise<StudioRevisionRecord[]> {
  const { url } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/content_revisions`);
  endpoint.searchParams.set(
    "select",
    "id,localization_id,revision_number,snapshot_json,reason,created_at",
  );
  endpoint.searchParams.set("localization_id", `eq.${localizationId}`);
  endpoint.searchParams.set("order", "revision_number.desc");
  endpoint.searchParams.set("limit", String(REVISION_HISTORY_LIMIT));

  const payload = await requestPublicationJson(endpoint);
  if (!Array.isArray(payload)) throw new Error("Studio revision history returned an invalid row payload.");

  const revisions = payload.map(parseStudioRevisionRow);
  if (revisions.some((revision) => revision === null)) {
    throw new Error("Studio revision history contains an unsupported immutable snapshot.");
  }

  return revisions as StudioRevisionRecord[];
}

export async function publishStudioDraft(
  localizationId: string,
  expectedLockVersion: number,
): Promise<StudioPublishResult> {
  await promoteStudioDraftReaderMedia(localizationId, expectedLockVersion);

  const { url } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/rpc/publish_content_draft`);
  const payload = await requestPublicationJson(endpoint, {
    method: "POST",
    body: JSON.stringify({
      p_localization_id: localizationId,
      p_expected_lock_version: expectedLockVersion,
    }),
  });

  if (!Array.isArray(payload) || payload.length !== 1) {
    throw new Error("Studio publish returned an invalid result payload.");
  }

  const result = parseStudioPublishResultRow(payload[0]);
  if (!result) throw new Error("Studio publish returned an incomplete result.");
  return result;
}

export async function archiveStudioPublication(
  localizationId: string,
  expectedRevisionId: string,
): Promise<void> {
  const { url } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/rpc/archive_published_localization`);
  const payload = await requestPublicationJson(endpoint, {
    method: "POST",
    body: JSON.stringify({
      p_localization_id: localizationId,
      p_expected_revision_id: expectedRevisionId,
    }),
  });

  if (!Array.isArray(payload) || payload.length !== 1 || !isRecord(payload[0]) || payload[0].publication_state !== "archived") {
    throw new Error("Studio archive returned an invalid result payload.");
  }
}
