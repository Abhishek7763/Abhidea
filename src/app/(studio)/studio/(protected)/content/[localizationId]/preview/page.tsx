import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isStudioUuid, otherStudioContentLocale, studioLocaleLabel } from "@/features/studio-content-model";
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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

type PreviewDevice = "desktop" | "mobile";
type PreviewTheme = "light" | "dark";

function firstSearchValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function previewHref(localizationId: string, device: PreviewDevice, theme: PreviewTheme): string {
  return `/studio/content/${localizationId}/preview?device=${device}&theme=${theme}`;
}

export default async function StudioDraftPreviewPage({ params, searchParams }: StudioDraftPreviewPageProps) {
  const { localizationId } = await params;
  if (!isStudioUuid(localizationId)) notFound();

  const resolvedSearchParams = await searchParams;
  const device: PreviewDevice = firstSearchValue(resolvedSearchParams.device) === "mobile" ? "mobile" : "desktop";
  const theme: PreviewTheme = firstSearchValue(resolvedSearchParams.theme) === "dark" ? "dark" : "light";

  const draft = await loadStudioDraftEditor(localizationId);
  if (!draft) notFound();

  const editions = await loadStudioEditionLinks(draft.contentId);
  const preview = buildStudioPreviewEntry(draft, editions);
  const backHref = `/studio/content/${draft.localizationId}/edit`;
  const counterpartLocale = otherStudioContentLocale(draft.locale);
  const counterpart = editions.find(
    (edition) => edition.locale === counterpartLocale && edition.lifecycleState === "active",
  );

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

  const frameSrc = `/studio/preview-frame/${draft.localizationId}?theme=${theme}`;

  return (
    <main className="studio-preview-workbench">
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Private preview</p>
          <h1 className="studio-title">Review saved draft</h1>
        </div>
        <div className="studio-content-filter-actions">
          <Link className="studio-content-secondary-link" href={`/studio/content/${draft.localizationId}/compare`}>
            Compare live & draft
          </Link>
          <Link className="studio-content-secondary-link" href={backHref}>
            Back to editor
          </Link>
        </div>
      </header>

      <section className="studio-panel studio-preview-control-panel" aria-label="Draft preview controls">
        <div className="studio-preview-control-group">
          <span>Device</span>
          <div>
            <Link aria-current={device === "desktop" ? "page" : undefined} href={previewHref(draft.localizationId, "desktop", theme)}>
              Desktop
            </Link>
            <Link aria-current={device === "mobile" ? "page" : undefined} href={previewHref(draft.localizationId, "mobile", theme)}>
              Mobile
            </Link>
          </div>
        </div>

        <div className="studio-preview-control-group">
          <span>Theme</span>
          <div>
            <Link aria-current={theme === "light" ? "page" : undefined} href={previewHref(draft.localizationId, device, "light")}>
              Light
            </Link>
            <Link aria-current={theme === "dark" ? "page" : undefined} href={previewHref(draft.localizationId, device, "dark")}>
              Dark
            </Link>
          </div>
        </div>

        <div className="studio-preview-control-group">
          <span>Language</span>
          <div>
            <span aria-current="page">{studioLocaleLabel(draft.locale)}</span>
            {counterpart ? (
              <Link href={previewHref(counterpart.localizationId, device, theme)}>
                {studioLocaleLabel(counterpartLocale)}
              </Link>
            ) : (
              <span aria-disabled="true">{studioLocaleLabel(counterpartLocale)} unavailable</span>
            )}
          </div>
        </div>
      </section>

      <section className="studio-preview-stage" data-device={device} aria-label={`${device} ${theme} draft preview`}>
        <div className="studio-preview-device-label" aria-hidden="true">
          {device === "mobile" ? "390px mobile viewport" : "Responsive desktop viewport"} · {theme}
        </div>
        <iframe
          className="studio-preview-frame"
          src={frameSrc}
          title={`${studioLocaleLabel(draft.locale)} draft preview in ${device} ${theme} mode`}
        />
      </section>
    </main>
  );
}
