import { cookies } from "next/headers";

import {
  filterStudioContentItems,
  isStudioContentLocale,
  isStudioEditorialStatus,
  type StudioContentFilters,
  type StudioContentListItem,
  type StudioContentTypeOption,
} from "@/features/studio-content-model";

const ACCESS_COOKIE = "abhidea-studio-access";
const DRAFT_WINDOW_SIZE = 500;

type StudioContentListData = Readonly<{
  items: readonly StudioContentListItem[];
  contentTypes: readonly StudioContentTypeOption[];
  filters: StudioContentFilters;
  loadedCount: number;
  sourceCount: number;
  isTruncated: boolean;
}>;

type RestRowsResult = Readonly<{
  rows: unknown[];
  totalCount: number | null;
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

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Studio CMS configuration is unavailable.");
  }

  return { url, publishableKey };
}

async function getStudioAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    throw new Error("Studio session token is unavailable.");
  }

  return accessToken;
}

function totalFromContentRange(value: string | null): number | null {
  if (!value) return null;
  const total = Number(value.split("/").at(-1));
  return Number.isFinite(total) ? total : null;
}

async function fetchStudioRows(
  endpoint: URL,
  accessToken: string,
  options: Readonly<{ count?: boolean }> = {},
): Promise<RestRowsResult> {
  const { publishableKey } = getSupabaseConfig();
  const response = await fetch(endpoint, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(options.count ? { Prefer: "count=exact" } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Studio CMS request failed with status ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Studio CMS returned an invalid row payload.");
  }

  return {
    rows: payload,
    totalCount: options.count ? totalFromContentRange(response.headers.get("content-range")) : null,
  };
}

function parseContentType(value: unknown): StudioContentTypeOption | null {
  if (!isRecord(value)) return null;
  const id = requiredString(value.id);
  const name = requiredString(value.name);
  const slug = requiredString(value.slug);
  return id && name && slug ? { id, name, slug } : null;
}

function parseDraftListItem(value: unknown): StudioContentListItem | null {
  if (!isRecord(value)) return null;

  const localizationId = requiredString(value.localization_id);
  const status = value.editorial_status;
  const updatedAt = requiredString(value.updated_at);
  const localization = isRecord(value.content_localizations) ? value.content_localizations : null;
  if (!localizationId || !isStudioEditorialStatus(status) || !updatedAt || !localization) return null;

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
    updatedAt,
    contentType,
  };
}

function canonicalizeFilters(
  filters: StudioContentFilters,
  contentTypes: readonly StudioContentTypeOption[],
): StudioContentFilters {
  if (filters.type === "all" || contentTypes.some((type) => type.slug === filters.type)) {
    return filters;
  }

  return { ...filters, type: "all" };
}

export async function loadStudioContentList(
  filters: StudioContentFilters,
): Promise<StudioContentListData> {
  const { url } = getSupabaseConfig();
  const accessToken = await getStudioAccessToken();

  const contentTypesEndpoint = new URL(`${url}/rest/v1/content_types`);
  contentTypesEndpoint.searchParams.set("select", "id,name,slug");
  contentTypesEndpoint.searchParams.set("order", "sort_order.asc,name.asc");

  const draftsEndpoint = new URL(`${url}/rest/v1/content_drafts`);
  draftsEndpoint.searchParams.set(
    "select",
    "localization_id,title,slug,summary,editorial_status,updated_at,content_localizations!inner(locale,content_id,contents!inner(content_types!inner(id,name,slug)))",
  );
  draftsEndpoint.searchParams.set("order", "updated_at.desc");
  draftsEndpoint.searchParams.set("limit", String(DRAFT_WINDOW_SIZE));

  const [contentTypeResult, draftResult] = await Promise.all([
    fetchStudioRows(contentTypesEndpoint, accessToken),
    fetchStudioRows(draftsEndpoint, accessToken, { count: true }),
  ]);

  const contentTypes = contentTypeResult.rows
    .map(parseContentType)
    .filter((value): value is StudioContentTypeOption => value !== null);

  const sourceItems = draftResult.rows
    .map(parseDraftListItem)
    .filter((value): value is StudioContentListItem => value !== null);

  const effectiveFilters = canonicalizeFilters(filters, contentTypes);
  const sourceCount = draftResult.totalCount ?? sourceItems.length;

  return {
    items: filterStudioContentItems(sourceItems, effectiveFilters),
    contentTypes,
    filters: effectiveFilters,
    loadedCount: sourceItems.length,
    sourceCount,
    isTruncated: sourceCount > sourceItems.length,
  };
}
