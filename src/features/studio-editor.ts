import { cookies } from "next/headers";

import {
  isStudioContentLocale,
  isStudioEditorialStatus,
  type StudioContentLocale,
  type StudioContentTypeOption,
  type StudioDraftCreateInput,
  type StudioEditorialStatus,
} from "@/features/studio-content-model";
import {
  parseStudioEditorDocument,
  type StudioEditableDocument,
  type StudioEditorDocumentParseResult,
} from "@/features/studio-editor-model";

const ACCESS_COOKIE = "abhidea-studio-access";

type UnknownRecord = Record<string, unknown>;

export type StudioDraftEditorData = Readonly<{
  localizationId: string;
  contentId: string;
  title: string;
  slug: string;
  summary: string;
  locale: StudioContentLocale;
  status: StudioEditorialStatus;
  lockVersion: number;
  updatedAt: string;
  contentType: StudioContentTypeOption;
  document: StudioEditorDocumentParseResult;
}>;

export type StudioDraftUpdateInput = Readonly<{
  localizationId: string;
  expectedLockVersion: number;
  title: string;
  slug: string;
  summary: string;
  bodyJson: StudioEditableDocument;
  editorialStatus: StudioEditorialStatus;
}>;

export type StudioDraftUpdateResult = Readonly<{
  lockVersion: number;
  updatedAt: string;
}>;

export type StudioEditionLink = Readonly<{
  localizationId: string;
  contentId: string;
  locale: StudioContentLocale;
}>;

export type StudioLinkedEditionCreateInput = Readonly<{
  sourceLocalizationId: string;
  locale: StudioContentLocale;
  title: string;
  slug: string;
  summary: string;
  bodyJson: StudioDraftCreateInput["bodyJson"];
}>;

export type StudioLinkedEditionCreateResult = Readonly<{
  contentId: string;
  localizationId: string;
}>;

export class StudioEditorRequestError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "StudioEditorRequestError";
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) throw new Error("Studio CMS configuration is unavailable.");
  return { url, publishableKey };
}

async function getStudioAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) throw new Error("Studio session token is unavailable.");
  return accessToken;
}

async function requestStudioJson(endpoint: URL, init: RequestInit = {}): Promise<unknown> {
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
        : `Studio editor request failed with status ${response.status}.`;
    throw new StudioEditorRequestError(message, response.status, code);
  }

  return payload;
}

function parseContentType(value: unknown): StudioContentTypeOption | null {
  if (!isRecord(value)) return null;
  const id = requiredString(value.id);
  const name = requiredString(value.name);
  const slug = requiredString(value.slug);
  return id && name && slug ? { id, name, slug } : null;
}

function parseEditorRow(value: unknown): StudioDraftEditorData | null {
  if (!isRecord(value)) return null;

  const localizationId = requiredString(value.localization_id);
  const updatedAt = requiredString(value.updated_at);
  const lockVersion = positiveInteger(value.lock_version);
  const status = value.editorial_status;
  const localization = isRecord(value.content_localizations) ? value.content_localizations : null;
  if (!localizationId || !updatedAt || !lockVersion || !isStudioEditorialStatus(status) || !localization) {
    return null;
  }

  const locale = localization.locale;
  const contentId = requiredString(localization.content_id);
  const content = isRecord(localization.contents) ? localization.contents : null;
  if (!isStudioContentLocale(locale) || !contentId || !content) return null;

  const contentType = parseContentType(content.content_types);
  if (!contentType) return null;

  return {
    localizationId,
    contentId,
    title: stringValue(value.title),
    slug: stringValue(value.slug),
    summary: stringValue(value.summary),
    locale,
    status,
    lockVersion,
    updatedAt,
    contentType,
    document: parseStudioEditorDocument(value.body_json),
  };
}

function parseEditionLink(value: unknown): StudioEditionLink | null {
  if (!isRecord(value)) return null;
  const localizationId = requiredString(value.id);
  const contentId = requiredString(value.content_id);
  const locale = value.locale;
  if (!localizationId || !contentId || !isStudioContentLocale(locale)) return null;
  return { localizationId, contentId, locale };
}

export async function loadStudioDraftEditor(localizationId: string): Promise<StudioDraftEditorData | null> {
  const { url } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/content_drafts`);
  endpoint.searchParams.set(
    "select",
    "localization_id,title,slug,summary,body_json,editorial_status,lock_version,updated_at,content_localizations!inner(locale,content_id,contents!inner(content_types!inner(id,name,slug)))",
  );
  endpoint.searchParams.set("localization_id", `eq.${localizationId}`);
  endpoint.searchParams.set("limit", "1");

  const payload = await requestStudioJson(endpoint);
  if (!Array.isArray(payload)) throw new Error("Studio editor returned an invalid row payload.");
  if (payload.length === 0) return null;

  const row = parseEditorRow(payload[0]);
  if (!row) throw new Error("Studio editor returned an invalid draft payload.");
  return row;
}

export async function loadStudioEditionLinks(contentId: string): Promise<readonly StudioEditionLink[]> {
  const { url } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/content_localizations`);
  endpoint.searchParams.set("select", "id,content_id,locale");
  endpoint.searchParams.set("content_id", `eq.${contentId}`);
  endpoint.searchParams.set("order", "locale.asc");
  endpoint.searchParams.set("limit", "2");

  const payload = await requestStudioJson(endpoint);
  if (!Array.isArray(payload)) throw new Error("Studio editions returned an invalid row payload.");

  return payload
    .map(parseEditionLink)
    .filter((value): value is StudioEditionLink => value !== null);
}

export async function createStudioLinkedEdition(
  input: StudioLinkedEditionCreateInput,
): Promise<StudioLinkedEditionCreateResult> {
  const { url } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/rpc/create_linked_content_edition`);
  const payload = await requestStudioJson(endpoint, {
    method: "POST",
    body: JSON.stringify({
      p_source_localization_id: input.sourceLocalizationId,
      p_locale: input.locale,
      p_title: input.title,
      p_slug: input.slug,
      p_summary: input.summary,
      p_body_json: input.bodyJson,
    }),
  });

  if (!Array.isArray(payload) || !isRecord(payload[0])) {
    throw new Error("Studio editions returned an invalid create result.");
  }

  const contentId = requiredString(payload[0].content_id);
  const localizationId = requiredString(payload[0].localization_id);
  if (!contentId || !localizationId) {
    throw new Error("Studio editions returned an incomplete create result.");
  }

  return { contentId, localizationId };
}

export async function updateStudioDraft(input: StudioDraftUpdateInput): Promise<StudioDraftUpdateResult> {
  const { url } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/rpc/update_content_draft`);
  const payload = await requestStudioJson(endpoint, {
    method: "POST",
    body: JSON.stringify({
      p_localization_id: input.localizationId,
      p_expected_lock_version: input.expectedLockVersion,
      p_title: input.title,
      p_slug: input.slug,
      p_summary: input.summary,
      p_body_json: input.bodyJson,
      p_editorial_status: input.editorialStatus,
    }),
  });

  if (!Array.isArray(payload) || !isRecord(payload[0])) {
    throw new Error("Studio editor returned an invalid update result.");
  }

  const lockVersion = positiveInteger(payload[0].lock_version);
  const updatedAt = requiredString(payload[0].updated_at);
  if (!lockVersion || !updatedAt) throw new Error("Studio editor returned an incomplete update result.");

  return { lockVersion, updatedAt };
}
