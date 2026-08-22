import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReaderView } from "@/features/reader/reader-view";
import { isStudioUuid } from "@/features/studio-content-model";
import { loadStudioDraftEditor, loadStudioEditionLinks } from "@/features/studio-editor";
import { buildStudioPreviewEntry } from "@/features/studio-preview";

export const metadata: Metadata = {
  title: "Private draft preview",
  robots: {
    index: false,
    follow: false,
  },
};

type StudioDraftPreviewPageProps = Readonly<{
  params: Promise<{ localizationId: string }>;
}>;

export default async function StudioDraftPreviewPage({ params }: StudioDraftPreviewPageProps) {
  const { localizationId } = await params;
  if (!isStudioUuid(localizationId)) notFound();

  const draft = await loadStudioDraftEditor(localizationId);
  if (!draft) notFound();

  const editions = await loadStudioEditionLinks(draft.contentId);
  const preview = buildStudioPreviewEntry(draft, editions);
  const backHref = `/studio/content/${draft.localizationId}/edit`;

  if (!preview.entry) {
    return (
      <main>
        <header className="studio-topbar">
          <div>
            <p className="studio-kicker">Private preview</p>
            <h1 className="studio-title">Preview unavailable</h1>
          </div>
          <Link className="studio-content-secondary-link" href={backHref}>
            Back to editor
          </Link>
        </header>

        <section className="studio-panel studio-content-error">
          <p className="studio-kicker">Safe rendering blocked</p>
          <h2>This saved body cannot be previewed safely</h2>
          <p>{draft.document.ok ? "The draft body could not be prepared for preview." : draft.document.message}</p>
          <p>The stored draft remains unchanged. Fix or migrate the unsupported blocks before previewing again.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="studio-reader-preview-host">
      <ReaderView
        entry={preview.entry}
        mode="draft-preview"
        backHref={backHref}
        previewAlternateHref={
          preview.alternateLocalizationId
            ? `/studio/content/${preview.alternateLocalizationId}/preview`
            : null
        }
      />
    </main>
  );
}
