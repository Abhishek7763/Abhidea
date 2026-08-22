import { notFound } from "next/navigation";

type ReaderPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export default async function EnglishReaderPage({ params }: ReaderPageProps) {
  await params;
  notFound();
}
