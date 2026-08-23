import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { resolveReaderEntry } from "@/features/reader/reader-delivery";
import {
  buildPublishedReaderMetadata,
  buildReaderFixtureMetadata,
  ReaderView,
} from "@/features/reader/reader-view";

type ReaderPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export async function generateMetadata({ params }: ReaderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveReaderEntry("en", slug);

  if (!resolved) {
    return {
      title: "Reader",
      robots: { index: false, follow: false },
    };
  }

  return resolved.source === "published"
    ? buildPublishedReaderMetadata(resolved.entry)
    : buildReaderFixtureMetadata(resolved.entry);
}

export default async function EnglishReaderPage({ params }: ReaderPageProps) {
  const { slug } = await params;
  const resolved = await resolveReaderEntry("en", slug);

  if (!resolved) notFound();

  return <ReaderView entry={resolved.entry} />;
}
