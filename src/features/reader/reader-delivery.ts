import type { ReaderLocale } from "./document-schema";
import { getDemoReaderFixture } from "./reader-demo-fixtures";
import type { ReaderEntry } from "./reader-entry";
import { getReaderFixture } from "./reader-fixtures";
import { getPublishedReaderEntry } from "./published-reader";

export type ReaderDeliveryResult = Readonly<{
  entry: ReaderEntry;
  source: "published" | "fixture";
}>;

export async function resolveReaderEntry(
  locale: ReaderLocale,
  slug: string,
): Promise<ReaderDeliveryResult | null> {
  const published = await getPublishedReaderEntry(locale, slug);
  if (published) return { entry: published, source: "published" };

  const fixture = getReaderFixture(locale, slug) ?? getDemoReaderFixture(locale, slug);
  return fixture ? { entry: fixture, source: "fixture" } : null;
}
