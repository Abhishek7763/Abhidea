import { cookies } from "next/headers";

const ACCESS_COOKIE = "abhidea-studio-access";
const MEDIA_LIBRARY_LIMIT = 100;
const MEDIA_PREVIEW_SECONDS = 900;

export type StudioMediaAsset = Readonly<{
  id: string;
  originalFilename: string;
  privateStorageKey: string | null;
  optimizedStorageKey: string | null;
  publicStorageKey: string | null;
  mimeType: string;
  byteSize: number;
  optimizedByteSize: number | null;
  width: number | null;
  height: number | null;
  optimizedAt: string | null;
  altText: string | null;
  caption: string | null;
  credit: string | null;
  sourceUrl: string | null;
  assetState: "staged" | "ready" | "retired";
  createdAt: string;
  updatedAt: string;
  previewUrl: string | null;
}>;

export type StudioMediaUsage = Readonly<{
  id: string;
  usageKind: string;
  contentId: string;
  localizationId: string | null;
  createdAt: string;
}>;

export type StudioMediaLibrary = Readonly<{
  items: readonly StudioMediaAsset[];
  isTruncated: boolean;
}>;

export type StudioMediaDetail = Readonly<{
  asset: StudioMediaAsset;
  usages: readonly StudioMediaUsage[];
}>;

export type StudioMediaUploadReservation = Readonly<{
  mediaId: string;
  storageKey: string;
  signedUploadUrl: string;
  publishableKey: string;
}>;

export type StudioMediaOptimizationReservation = Readonly<{
  mediaId: string;
  storageKey: string;
  signedUploadUrl: string;
  publishableKey: string;
}>;

export type StudioMediaReservationInput = Readonly<{
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  altText: string;
  caption: string;
  credit: string;
  sourceUrl: string;
}>;

export type StudioMediaMetadataInput = Readonly<{
  mediaId: string;
  altText: string;
  caption: string;
  credit: string;
  sourceUrl: string;
}>;

type UnknownRecord = Record<string, unknown>;

type SupabaseConfig = Readonly<{
  url: string;
  publishableKey: string;
}>;

export class StudioMediaRequestError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "StudioMediaRequestError";
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

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function nullablePositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function safeByteSize(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function nullableByteSize(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Studio media configuration is unavailable.");
  }

  return { url, publishableKey };
}

async function getStudioAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) throw new StudioMediaRequestError("Studio session token is unavailable.", 401);
  return accessToken;
}

function apiHeaders(config: SupabaseConfig, accessToken: string): Record<string, string> {
  return {
    apikey: config.publishableKey,
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };
}

function encodeStoragePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function parseRequestError(response: Response, fallback: string): Promise<StudioMediaRequestError> {
  let code: string | null = null;
  let message = fallback;
  try {
    const body = (await response.json()) as unknown;
    if (isRecord(body)) {
      code = nullableString(body.code);
      message = nullableString(body.message) ?? message;
    }
  } catch {
    // Keep the stable user-facing fallback.
  }
  return new StudioMediaRequestError(message, response.status, code);
}

async function callStudioMediaRpc(functionName: string, body: unknown): Promise<unknown> {
  const config = getSupabaseConfig();
  const accessToken = await getStudioAccessToken();
  const response = await fetch(`${config.url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      ...apiHeaders(config, accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseRequestError(response, `Studio media workflow failed with status ${response.status}.`);
  }

  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function fetchStudioRows(endpoint: URL): Promise<unknown[]> {
  const config = getSupabaseConfig();
  const accessToken = await getStudioAccessToken();
  const response = await fetch(endpoint, {
    headers: apiHeaders(config, accessToken),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseRequestError(response, `Studio media read failed with status ${response.status}.`);
  }

  const body = (await response.json()) as unknown;
  if (!Array.isArray(body)) throw new Error("Studio media returned an invalid row payload.");
  return body;
}

function parseAsset(value: unknown): Omit<StudioMediaAsset, "previewUrl"> | null {
  if (!isRecord(value)) return null;

  const id = requiredString(value.id);
  const originalFilename = requiredString(value.original_filename);
  const mimeType = requiredString(value.mime_type);
  const byteSize = safeByteSize(value.byte_size);
  const assetState = value.asset_state;
  const createdAt = requiredString(value.created_at);
  const updatedAt = requiredString(value.updated_at);

  if (
    !id ||
    !originalFilename ||
    !mimeType ||
    byteSize === null ||
    (assetState !== "staged" && assetState !== "ready" && assetState !== "retired") ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    originalFilename,
    privateStorageKey: nullableString(value.private_storage_key),
    optimizedStorageKey: nullableString(value.optimized_storage_key),
    publicStorageKey: nullableString(value.public_storage_key),
    mimeType,
    byteSize,
    optimizedByteSize: nullableByteSize(value.optimized_byte_size),
    width: nullablePositiveInteger(value.width),
    height: nullablePositiveInteger(value.height),
    optimizedAt: nullableString(value.optimized_at),
    altText: nullableString(value.alt_text),
    caption: nullableString(value.caption),
    credit: nullableString(value.credit),
    sourceUrl: nullableString(value.source_url),
    assetState,
    createdAt,
    updatedAt,
  };
}

function parseUsage(value: unknown): StudioMediaUsage | null {
  if (!isRecord(value)) return null;
  const id = requiredString(value.id);
  const usageKind = requiredString(value.usage_kind);
  const contentId = requiredString(value.content_id);
  const createdAt = requiredString(value.created_at);
  if (!id || !usageKind || !contentId || !createdAt) return null;
  return {
    id,
    usageKind,
    contentId,
    localizationId: nullableString(value.localization_id),
    createdAt,
  };
}

async function createSignedPreviewUrls(paths: readonly string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();

  const config = getSupabaseConfig();
  const accessToken = await getStudioAccessToken();
  const response = await fetch(`${config.url}/storage/v1/object/sign/media-private`, {
    method: "POST",
    headers: {
      ...apiHeaders(config, accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: MEDIA_PREVIEW_SECONDS, paths }),
    cache: "no-store",
  });

  if (!response.ok) return new Map();
  const body = (await response.json()) as unknown;
  if (!Array.isArray(body)) return new Map();

  const previews = new Map<string, string>();
  for (const item of body) {
    if (!isRecord(item)) continue;
    const path = requiredString(item.path);
    const signedPath = nullableString(item.signedURL);
    if (!path || !signedPath) continue;
    previews.set(path, `${config.url}/storage/v1${signedPath}`);
  }
  return previews;
}

function previewStorageKey(asset: Omit<StudioMediaAsset, "previewUrl">): string | null {
  return asset.optimizedStorageKey ?? asset.privateStorageKey;
}

export async function loadStudioMediaLibrary(): Promise<StudioMediaLibrary> {
  const config = getSupabaseConfig();
  const endpoint = new URL(`${config.url}/rest/v1/media_assets`);
  endpoint.searchParams.set(
    "select",
    "id,original_filename,private_storage_key,optimized_storage_key,public_storage_key,mime_type,byte_size,optimized_byte_size,width,height,optimized_at,alt_text,caption,credit,source_url,asset_state,created_at,updated_at",
  );
  endpoint.searchParams.set("order", "created_at.desc");
  endpoint.searchParams.set("limit", String(MEDIA_LIBRARY_LIMIT + 1));

  const rawRows = await fetchStudioRows(endpoint);
  const parsed = rawRows.map(parseAsset).filter((item): item is NonNullable<typeof item> => item !== null);
  const isTruncated = parsed.length > MEDIA_LIBRARY_LIMIT;
  const visible = parsed.slice(0, MEDIA_LIBRARY_LIMIT);
  const previewPaths = visible.flatMap((asset) => {
    const key = previewStorageKey(asset);
    return key ? [key] : [];
  });
  const previews = await createSignedPreviewUrls(previewPaths);

  return {
    items: visible.map((asset) => {
      const key = previewStorageKey(asset);
      return {
        ...asset,
        previewUrl: key ? (previews.get(key) ?? null) : null,
      };
    }),
    isTruncated,
  };
}

export async function loadStudioMediaDetail(mediaId: string): Promise<StudioMediaDetail | null> {
  const config = getSupabaseConfig();
  const assetEndpoint = new URL(`${config.url}/rest/v1/media_assets`);
  assetEndpoint.searchParams.set(
    "select",
    "id,original_filename,private_storage_key,optimized_storage_key,public_storage_key,mime_type,byte_size,optimized_byte_size,width,height,optimized_at,alt_text,caption,credit,source_url,asset_state,created_at,updated_at",
  );
  assetEndpoint.searchParams.set("id", `eq.${mediaId}`);
  assetEndpoint.searchParams.set("limit", "1");

  const assetRows = await fetchStudioRows(assetEndpoint);
  const asset = parseAsset(assetRows[0]);
  if (!asset) return null;

  const usageEndpoint = new URL(`${config.url}/rest/v1/media_usages`);
  usageEndpoint.searchParams.set("select", "id,usage_kind,content_id,localization_id,created_at");
  usageEndpoint.searchParams.set("media_id", `eq.${mediaId}`);
  usageEndpoint.searchParams.set("order", "created_at.desc");
  const usages = (await fetchStudioRows(usageEndpoint))
    .map(parseUsage)
    .filter((item): item is StudioMediaUsage => item !== null);

  const previewKey = previewStorageKey(asset);
  const previews = previewKey ? await createSignedPreviewUrls([previewKey]) : new Map<string, string>();

  return {
    asset: {
      ...asset,
      previewUrl: previewKey ? (previews.get(previewKey) ?? null) : null,
    },
    usages,
  };
}

async function createSignedMediaUploadTicket(
  bucket: "media-private",
  storageKey: string,
): Promise<Readonly<{ signedUploadUrl: string; publishableKey: string }>> {
  const config = getSupabaseConfig();
  const accessToken = await getStudioAccessToken();
  const response = await fetch(
    `${config.url}/storage/v1/object/upload/sign/${bucket}/${encodeStoragePath(storageKey)}`,
    {
      method: "POST",
      headers: {
        ...apiHeaders(config, accessToken),
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw await parseRequestError(response, "Could not create a private upload ticket.");
  }

  const signedPayload = (await response.json()) as unknown;
  if (!isRecord(signedPayload) || !requiredString(signedPayload.url)) {
    throw new Error("Storage did not return a signed upload ticket.");
  }

  const signedPath = requiredString(signedPayload.url)!;
  return {
    signedUploadUrl: signedPath.startsWith("http")
      ? signedPath
      : `${config.url}/storage/v1${signedPath.startsWith("/") ? signedPath : `/${signedPath}`}`,
    publishableKey: config.publishableKey,
  };
}

export async function reserveStudioMediaUpload(
  input: StudioMediaReservationInput,
): Promise<StudioMediaUploadReservation> {
  const payload = await callStudioMediaRpc("reserve_media_upload", {
    p_original_filename: input.originalFilename,
    p_mime_type: input.mimeType,
    p_byte_size: input.byteSize,
    p_alt_text: input.altText || null,
    p_caption: input.caption || null,
    p_credit: input.credit || null,
    p_source_url: input.sourceUrl || null,
  });

  if (!Array.isArray(payload) || !isRecord(payload[0])) {
    throw new Error("Media reservation returned an invalid payload.");
  }

  const mediaId = requiredString(payload[0].media_id);
  const storageKey = requiredString(payload[0].storage_key);
  if (!mediaId || !storageKey) throw new Error("Media reservation identity is missing.");

  let ticket;
  try {
    ticket = await createSignedMediaUploadTicket("media-private", storageKey);
  } catch (error) {
    await cancelStudioMediaUpload(mediaId).catch(() => undefined);
    throw error;
  }

  return {
    mediaId,
    storageKey,
    signedUploadUrl: ticket.signedUploadUrl,
    publishableKey: ticket.publishableKey,
  };
}

export async function finalizeStudioMediaUpload(mediaId: string, storageKey: string): Promise<void> {
  await callStudioMediaRpc("finalize_media_upload", {
    p_media_id: mediaId,
    p_storage_key: storageKey,
  });
}

export async function cancelStudioMediaUpload(mediaId: string, storageKey?: string): Promise<void> {
  if (storageKey) {
    const config = getSupabaseConfig();
    const accessToken = await getStudioAccessToken();
    const response = await fetch(`${config.url}/storage/v1/object/media-private`, {
      method: "DELETE",
      headers: {
        ...apiHeaders(config, accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: [storageKey] }),
      cache: "no-store",
    });
    if (!response.ok) {
      throw await parseRequestError(response, "Failed upload object could not be cleaned up safely.");
    }
  }

  await callStudioMediaRpc("cancel_media_upload", { p_media_id: mediaId });
}

export async function prepareStudioMediaOptimizedVariant(
  mediaId: string,
): Promise<StudioMediaOptimizationReservation> {
  const payload = await callStudioMediaRpc("prepare_media_optimized_variant", {
    p_media_id: mediaId,
  });

  if (!Array.isArray(payload) || !isRecord(payload[0])) {
    throw new Error("Media optimization reservation returned an invalid payload.");
  }

  const storageKey = requiredString(payload[0].storage_key);
  if (!storageKey) throw new Error("Media optimization storage identity is missing.");

  const ticket = await createSignedMediaUploadTicket("media-private", storageKey);
  return {
    mediaId,
    storageKey,
    signedUploadUrl: ticket.signedUploadUrl,
    publishableKey: ticket.publishableKey,
  };
}

export async function finalizeStudioMediaOptimizedVariant(
  mediaId: string,
  storageKey: string,
  width: number,
  height: number,
): Promise<void> {
  await callStudioMediaRpc("finalize_media_optimized_variant", {
    p_media_id: mediaId,
    p_storage_key: storageKey,
    p_width: width,
    p_height: height,
  });
}

export async function updateStudioMediaMetadata(input: StudioMediaMetadataInput): Promise<void> {
  await callStudioMediaRpc("update_media_metadata", {
    p_media_id: input.mediaId,
    p_alt_text: input.altText || null,
    p_caption: input.caption || null,
    p_credit: input.credit || null,
    p_source_url: input.sourceUrl || null,
  });
}
