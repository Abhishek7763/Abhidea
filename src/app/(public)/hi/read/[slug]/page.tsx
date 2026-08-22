import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getReaderFixture } from "@/features/reader/reader-fixtures";
import { buildReaderFixtureMetadata, ReaderView } from "@/features/reader/reader-view";

type ReaderPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export async function generateMetadata({ params }: ReaderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getReaderFixture("hi", slug);

  if (!entry) {
    return {
      title: "Reader",
      robots: { index: false, follow: false },
    };
  }

  return buildReaderFixtureMetadata(entry);
}

export default async function HindiReaderPage({ params }: ReaderPageProps) {
  const { slug } = await params;
  const entry = getReaderFixture("hi", slug);

  if (!entry) notFound();

  return <ReaderView entry={entry} />;
}
