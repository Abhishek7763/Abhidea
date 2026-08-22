import { cookies } from "next/headers";

import {
  parseStudioPublicationRow,
  type StudioPublicationStatus,
} from "@/features/studio-publication-model";

const ACCESS_COOKIE = "abhidea-studio-access";

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

export async function loadStudioPublicationStatus(
  localizationId: string,
): Promise<StudioPublicationStatus | null> {
  const { url, publishableKey } = getSupabaseConfig();
  const accessToken = await getStudioAccessToken();
  const endpoint = new URL(`${url}/rest/v1/published_localizations`);
  endpoint.searchParams.set(
    "select",
    "localization_id,revision_id,slug,publication_state,published_at,updated_at,content_revisions!inner(revision_number)",
  );
  endpoint.searchParams.set("localization_id", `eq.${localizationId}`);
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Studio publication request failed with status ${response.status}.`);
  }
  if (!Array.isArray(payload)) throw new Error("Studio publication returned an invalid row payload.");
  if (payload.length === 0) return null;

  const status = parseStudioPublicationRow(payload[0]);
  if (!status) throw new Error("Studio publication returned an invalid publication payload.");
  return status;
}
