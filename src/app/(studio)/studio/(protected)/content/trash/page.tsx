import Link from "next/link";

import { StudioRestoreForm } from "@/app/(studio)/studio/(protected)/content/trash/restore-form";
import {
  studioEditorialStatusLabel,
  studioLocaleLabel,
} from "@/features/studio-content-model";
import { loadStudioTrashList } from "@/features/studio-content";

type StudioTrashPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstSearchValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatTrashedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Trash time unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function StudioTrashPage({ searchParams }: StudioTrashPageProps) {
  const [data, resolvedSearchParams] = await Promise.all([
    loadStudioTrashList(),
    searchParams,
  ]);
  const justTrashed = firstSearchValue(resolvedSearchParams.trashed) === "1";

  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Workspace</p>
          <h1 className="studio-title">Trash</h1>
        </div>
        <Link className="studio-content-secondary-link" href="/studio/content">
          Back to content
        </Link>
      </header>

      {justTrashed ? (
        <div className="studio-content-notice" role="status">
          <strong>Edition moved to Trash.</strong>
          <span>It is out of the active library. Any public Reader snapshot was archived, while draft data and revisions were preserved.</span>
        </div>
      ) : null}

      <section className="studio-panel studio-content-toolbar" aria-labelledby="trash-heading">
        <div className="studio-content-intro">
          <div className="studio-content-intro-heading">
            <div>
              <p className="studio-kicker">Reversible lifecycle</p>
              <h2 id="trash-heading">Restore without republishing</h2>
            </div>
          </div>
          <p>
            Trash stores localized editions safely instead of deleting them. Restore returns an edition to the private Studio library only; archived public access stays offline until you explicitly Publish again.
          </p>
        </div>
      </section>

      <section className="studio-content-results" aria-label="Trashed content editions">
        <div className="studio-content-summary">
          <p>
            {data.sourceCount === 0
              ? "Trash is empty"
              : `${data.sourceCount} trashed edition${data.sourceCount === 1 ? "" : "s"}`}
          </p>
          {data.isTruncated ? <span>Showing the first 500 trashed editions.</span> : null}
        </div>

        {data.items.length === 0 ? (
          <div className="studio-panel studio-content-empty">
            <p className="studio-kicker">Nothing to restore</p>
            <h2>Trash is empty</h2>
            <p>Active drafts stay in the Content library. Moving an edition here never permanently deletes its work.</p>
            <Link className="studio-content-primary-link" href="/studio/content">
              Return to content
            </Link>
          </div>
        ) : (
          <div className="studio-content-list">
            {data.items.map((item) => (
              <article className="studio-content-card" key={item.localizationId}>
                <div className="studio-content-card-main">
                  <div className="studio-content-card-meta">
                    <span>{item.contentType.name}</span>
                    <span>{studioLocaleLabel(item.locale)}</span>
                    <span data-status={item.status}>{studioEditorialStatusLabel(item.status)}</span>
                  </div>
                  <h2>{item.title || "Untitled draft"}</h2>
                  <p>{item.summary || "No summary added yet."}</p>
                </div>

                <div className="studio-content-card-foot">
                  <span>{item.slug ? `/${item.slug}` : "Slug not set"}</span>
                  <time dateTime={item.trashedAt}>Trashed {formatTrashedAt(item.trashedAt)}</time>
                  <StudioRestoreForm
                    localizationId={item.localizationId}
                    lockVersion={item.lockVersion}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
