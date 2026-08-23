import Link from "next/link";

import { loadStudioMediaLibrary } from "@/features/studio-media";

import { MediaUploadForm } from "./media-upload-form";

type StudioMediaPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstSearchValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

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

export default async function StudioMediaPage({ searchParams }: StudioMediaPageProps) {
  const params = await searchParams;
  const uploaded = firstSearchValue(params.uploaded) === "1";
  const optimized = firstSearchValue(params.optimized) === "1";
  const library = await loadStudioMediaLibrary();

  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Workspace</p>
          <h1 className="studio-title">Media</h1>
        </div>
        <span className="studio-status">Private library</span>
      </header>

      {uploaded ? (
        <div className="studio-content-notice" role="status">
          <strong>{optimized ? "Image uploaded and optimized." : "Image uploaded."}</strong>
          <span>
            {optimized
              ? "The original and smaller WebP copy are both private and ready for reuse."
              : "The original is private. Open its details to finish web optimization."}
          </span>
        </div>
      ) : null}

      <section className="studio-panel studio-media-upload-panel" aria-labelledby="media-upload-heading">
        <div className="studio-media-section-heading">
          <div>
            <p className="studio-kicker">Private upload</p>
            <h2 id="media-upload-heading">Add an image</h2>
          </div>
          <span>{library.items.length} asset{library.items.length === 1 ? "" : "s"}</span>
        </div>
        <p>
          Originals upload directly to protected Storage, then this device prepares a smaller private WebP copy up to 1920px. Draft media stays private until a later content publish integration promotes what is actually needed.
        </p>
        <MediaUploadForm />
      </section>

      <section className="studio-media-library" aria-labelledby="media-library-heading">
        <div className="studio-media-section-heading">
          <div>
            <p className="studio-kicker">Reusable assets</p>
            <h2 id="media-library-heading">Media Library</h2>
          </div>
          {library.isTruncated ? <span>Showing latest 100</span> : <span>Protected</span>}
        </div>

        {library.items.length === 0 ? (
          <div className="studio-panel studio-content-empty">
            <p className="studio-kicker">Library ready</p>
            <h2>No images yet</h2>
            <p>Upload the first image above. A stable Media ID is created before Storage accepts the file.</p>
          </div>
        ) : (
          <div className="studio-media-grid">
            {library.items.map((asset) => (
              <article className="studio-media-card" key={asset.id}>
                <div className="studio-media-thumb">
                  {asset.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.previewUrl} alt={asset.altText ?? ""} loading="lazy" />
                  ) : (
                    <span>Preview unavailable</span>
                  )}
                </div>
                <div className="studio-media-card-body">
                  <div className="studio-media-card-meta">
                    <span>{asset.mimeType.replace("image/", "").toUpperCase()}</span>
                    <span data-state={asset.optimizedStorageKey ? "optimized" : asset.assetState}>
                      {asset.optimizedStorageKey ? "Web optimized" : asset.assetState}
                    </span>
                  </div>
                  <h3>{asset.originalFilename}</h3>
                  <p>{asset.altText || "Alt text not added yet."}</p>
                  <div className="studio-media-card-foot">
                    <span>
                      {asset.optimizedByteSize
                        ? `${formatBytes(asset.optimizedByteSize)} optimized`
                        : `${formatBytes(asset.byteSize)} original`}
                    </span>
                    <time dateTime={asset.createdAt}>{formatDate(asset.createdAt)}</time>
                  </div>
                  <Link href={`/studio/media/${asset.id}`}>Open details</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
