import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ReaderView } from "@/features/reader/reader-view";
import { inspectStudioSession } from "@/features/studio-auth";
import { isStudioUuid } from "@/features/studio-content-model";
import { loadStudioDraftEditor, loadStudioEditionLinks } from "@/features/studio-editor";
import { buildStudioPreviewEntry } from "@/features/studio-preview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private draft preview frame",
  robots: {
    index: false,
    follow: false,
  },
};

type StudioPreviewFramePageProps = Readonly<{
  params: Promise<{ localizationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstSearchValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StudioPreviewFramePage({ params, searchParams }: StudioPreviewFramePageProps) {
  const { localizationId } = await params;
  if (!isStudioUuid(localizationId)) notFound();

  const session = await inspectStudioSession();
  if (session.status === "refresh-required") {
    redirect(`/studio/session/refresh?next=/studio/content/${localizationId}/preview`);
  }
  if (session.status === "forbidden") redirect("/studio/login?error=not-authorized");
  if (session.status !== "active") redirect("/studio/login");

  const resolvedSearchParams = await searchParams;
  const theme = firstSearchValue(resolvedSearchParams.theme) === "dark" ? "dark" : "light";
  const draft = await loadStudioDraftEditor(localizationId);
  if (!draft) notFound();

  const editions = await loadStudioEditionLinks(draft.contentId);
  const preview = buildStudioPreviewEntry(draft, editions);
  if (!preview.entry) notFound();

  const alternateHref = preview.alternateLocalizationId
    ? `/studio/preview-frame/${preview.alternateLocalizationId}?theme=${theme}`
    : null;

  return (
    <main className="studio-preview-frame-root" data-theme={theme}>
      <ReaderView
        entry={preview.entry}
        mode="draft-preview"
        backHref={`/studio/content/${draft.localizationId}/edit`}
        previewAlternateHref={alternateHref}
      />
    </main>
  );
}
