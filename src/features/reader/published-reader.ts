import { cache } from "react";

import {
  parseReaderDocument,
  type ReaderBlock,
  type ReaderLocale,
} from "./document-schema";
import type { ReaderEntry } from "./reader-entry";

type UnknownRecord = Record<string, unknown>;

type PublishedReaderRow = Readonly<{
  contentId: string;
  locale: ReaderLocale;
  slug: string;
  title: string;
  summary: string;
  body: ReturnType<typeof parseReaderDocument>["document"];
  contentTypeName: string;
  subjects: string[];
}>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parseSubjects(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const names: string[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const name = requiredString(item.name);
    if (!name) return null;
    names.push(name);
  }
  return names;
}

function parsePublishedReaderRow(value: unknown): PublishedReaderRow | null {
  if (!isRecord(value)) return null;

  const contentId = requiredString(value.content_id);
  const locale = value.locale === "en" || value.locale === "hi" ? value.locale : null;
  const slug = requiredString(value.slug);
  const title = requiredString(value.title);
  const summary = typeof value.summary === "string" ? value.summary : null;
  const contentTypeName = requiredString(value.content_type_name);
  const subjects = parseSubjects(value.subjects_json);
  const parsedBody = parseReaderDocument(value.body_json);

  if (
    !contentId ||
    !locale ||
    !slug ||
    !title ||
    summary === null ||
    !contentTypeName ||
    !subjects ||
    !parsedBody.schemaSupported ||
    parsedBody.ignoredBlocks > 0 ||
    parsedBody.document.blocks.length === 0
  ) {
    return null;
  }

  return {
    contentId,
    locale,
    slug,
    title,
    summary,
    body: parsedBody.document,
    contentTypeName,
    subjects,
  };
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Published Reader configuration is unavailable.");
  return { url, publishableKey };
}

async function requestRows(endpoint: URL): Promise<unknown[]> {
  const { publishableKey } = getSupabaseConfig();
  const response = await fetch(endpoint, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Published Reader request failed with status ${response.status}.`);
  if (!Array.isArray(payload)) throw new Error("Published Reader returned an invalid row payload.");
  return payload;
}

function blockText(block: ReaderBlock): string {
  switch (block.type) {
    case "paragraph":
    case "heading":
    case "quote":
    case "callout":
      return block.text;
    case "list":
      return block.items.join(" ");
    case "closure":
      return `${block.title} ${block.text}`;
    case "figure":
      return `${block.alt} ${block.caption ?? ""}`;
    case "divider":
      return "";
  }
}

function estimateMinutes(blocks: readonly ReaderBlock[]): number {
  const words = blocks
    .map(blockText)
    .join(" ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 190));
}

async function loadPublishedReaderEntry(locale: ReaderLocale, slug: string): Promise<ReaderEntry | null> {
  const { url } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/published_localizations`);
  endpoint.searchParams.set(
    "select",
    "content_id,locale,slug,title,summary,body_json,subjects_json,content_type_name",
  );
  endpoint.searchParams.set("publication_state", "eq.published");
  endpoint.searchParams.set("locale", `eq.${locale}`);
  endpoint.searchParams.set("slug", `eq.${slug}`);
  endpoint.searchParams.set("limit", "1");

  const rows = await requestRows(endpoint);
  if (rows.length === 0) return null;

  const row = parsePublishedReaderRow(rows[0]);
  if (!row) throw new Error("Published Reader row failed canonical validation.");

  const alternateLocale: ReaderLocale = locale === "en" ? "hi" : "en";
  const alternateEndpoint = new URL(`${url}/rest/v1/published_localizations`);
  alternateEndpoint.searchParams.set("select", "locale,slug");
  alternateEndpoint.searchParams.set("publication_state", "eq.published");
  alternateEndpoint.searchParams.set("content_id", `eq.${row.contentId}`);
  alternateEndpoint.searchParams.set("locale", `eq.${alternateLocale}`);
  alternateEndpoint.searchParams.set("limit", "1");

  const alternateRows = await requestRows(alternateEndpoint);
  const alternateSlug = alternateRows.length > 0 && isRecord(alternateRows[0])
    ? requiredString(alternateRows[0].slug)
    : null;
  const minutes = estimateMinutes(row.body.blocks);

  return {
    locale: row.locale,
    slug: row.slug,
    alternateLocale,
    alternateSlug,
    title: row.title,
    summary: row.summary,
    eyebrow: row.contentTypeName,
    contentType: row.contentTypeName,
    subjects: row.subjects,
    readingTime: row.locale === "hi" ? `${minutes} मिनट पढ़ना` : `${minutes} min read`,
    body: row.body,
    sources: [],
    related: [],
  };
}

export const getPublishedReaderEntry = cache(loadPublishedReaderEntry);
