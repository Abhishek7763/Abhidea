import { cookies } from "next/headers";

const ACCESS_COOKIE = "abhidea-studio-access";

type UnknownRecord = Record<string, unknown>;

export class StudioTrashRequestError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "StudioTrashRequestError";
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
  if (!url || !publishableKey) throw new Error("Studio lifecycle configuration is unavailable.");
  return { url, publishableKey };
}

async function getStudioAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!token) throw new Error("Studio session token is unavailable.");
  return token;
}

async function callLifecycleRpc(name: string, body: unknown): Promise<unknown> {
  const { url, publishableKey } = getSupabaseConfig();
  const token = await getStudioAccessToken();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = isRecord(payload) && typeof payload.code === "string" ? payload.code : undefined;
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : `Studio lifecycle request failed with status ${response.status}.`;
    throw new StudioTrashRequestError(message, response.status, code);
  }

  return payload;
}

export async function trashStudioLocalization(
  localizationId: string,
  expectedLockVersion: number,
  expectedLiveRevisionId: string | null,
): Promise<void> {
  const payload = await callLifecycleRpc("trash_content_localization", {
    p_localization_id: localizationId,
    p_expected_lock_version: expectedLockVersion,
    p_expected_live_revision_id: expectedLiveRevisionId,
  });

  if (!Array.isArray(payload) || payload.length !== 1 || !isRecord(payload[0]) || payload[0].lifecycle_state !== "trashed") {
    throw new Error("Studio Trash returned an invalid result payload.");
  }
}

export async function restoreStudioLocalization(
  localizationId: string,
  expectedLockVersion: number,
): Promise<void> {
  const payload = await callLifecycleRpc("restore_content_localization", {
    p_localization_id: localizationId,
    p_expected_lock_version: expectedLockVersion,
  });

  if (!Array.isArray(payload) || payload.length !== 1 || !isRecord(payload[0]) || payload[0].lifecycle_state !== "active") {
    throw new Error("Studio Restore returned an invalid result payload.");
  }
}
