import { cookies } from "next/headers";

import {
  parseStudioPublicationRow,
  parseStudioPublishResultRow,
  type StudioPublicationStatus,
  type StudioPublishResult,
} from "@/features/studio-publication-model";

const ACCESS_COOKIE = "abhidea-studio-access";

type UnknownRecord = Record<string, unknown>;

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
    const code = isRecord(payload) && typeof payload.code === "string" ? payload.code : undefined;
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : `Studio publication request failed with status ${response.status}.`;
    throw new StudioPublicationRequestError(message, response.status, code);
  }

  return payload;
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

export async function publishStudioDraft(
  localizationId: string,
  expectedLockVersion: number,
): Promise<StudioPublishResult> {
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
