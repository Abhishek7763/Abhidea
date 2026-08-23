import Link from "next/link";
import { notFound } from "next/navigation";

import { isStudioUuid } from "@/features/studio-content-model";
import { loadStudioMediaDetail } from "@/features/studio-media";

import { MediaMetadataForm } from "./media-metadata-form";

type StudioMediaDetailPageProps = Readonly<{
  params: Promise<{ mediaId: string }>;
}>;

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MiB`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function StudioMediaDetailPage({ params }: StudioMediaDetailPageProps) {
  const { mediaId } = await params;
  if (!isStudioUuid(mediaId)) notFound();

  const detail = await loadStudioMediaDetail(mediaId);
  if (!detail) notFound();

  const { asset, usages } = detail;

  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Media Library</p>
          <h1 className="studio-title">Image details</h1>
        </div>
        <Link className="studio-content-secondary-link" href="/studio/media">Back to Media</Link>
      </header>

      <section className="studio-media-detail-layout">
        <div className="studio-panel studio-media-detail-preview">
          <div className="studio-media-detail-image">
            {asset.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.previewUrl} alt={asset.altText ?? ""} />
            ) : (
              <span>Private preview unavailable</span>
            )}
          </div>

          <div className="studio-media-detail-facts">
            <div><span>Filename</span><strong>{asset.originalFilename}</strong></div>
            <div><span>Format</span><strong>{asset.mimeType}</strong></div>
            <div><span>Size</span><strong>{formatBytes(asset.byteSize)}</strong></div>
            <div><span>State</span><strong>{asset.assetState}</strong></div>
            <div><span>Dimensions</span><strong>{asset.width && asset.height ? `${asset.width} × ${asset.height}` : "Captured during optimization later"}</strong></div>
            <div><span>Created</span><strong>{formatDate(asset.createdAt)}</strong></div>
          </div>
        </div>

        <div className="studio-panel studio-media-detail-editor">
          <p className="studio-kicker">Accessibility & attribution</p>
          <h2>Edit metadata</h2>
          <p>Alt text, caption, credit and source stay attached to this stable Media ID.</p>
          <MediaMetadataForm
            mediaId={asset.id}
            altText={asset.altText}
            caption={asset.caption}
            credit={asset.credit}
            sourceUrl={asset.sourceUrl}
          />
        </div>
      </section>

      <section className="studio-panel studio-media-usages" aria-labelledby="where-used-heading">
        <div className="studio-media-section-heading">
          <div>
            <p className="studio-kicker">Dependency safety</p>
            <h2 id="where-used-heading">Where used</h2>
          </div>
          <span>{usages.length} usage{usages.length === 1 ? "" : "s"}</span>
        </div>

        {usages.length === 0 ? (
          <p>This asset is not linked to content yet. Content-side media selection follows after the upload library is stable.</p>
        ) : (
          <div className="studio-media-usage-list">
            {usages.map((usage) => (
              <div key={usage.id}>
                <strong>{usage.usageKind}</strong>
                <span>Content {usage.contentId}</span>
                {usage.localizationId ? <span>Edition {usage.localizationId}</span> : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
