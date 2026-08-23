import Link from "next/link";
import { notFound } from "next/navigation";

import { isStudioUuid, studioEditorialStatusLabel, studioLocaleLabel } from "@/features/studio-content-model";
import { loadStudioDraftEditor } from "@/features/studio-editor";
import { buildStudioLiveDraftComparison } from "@/features/studio-live-draft-compare";
import type { StudioRevisionFieldChange } from "@/features/studio-publication-model";
import { loadStudioPublicationStatus, loadStudioRevisionHistory } from "@/features/studio-publication";

type StudioLiveDraftComparePageProps = Readonly<{
  params: Promise<{ localizationId: string }>;
}>;

function ComparisonField({ label, change }: Readonly<{ label: string; change: StudioRevisionFieldChange }>) {
  return (
    <article className="studio-live-draft-field" data-changed={change.changed ? "true" : "false"}>
      <span>{label}</span>
      <div>
        <small>Published baseline</small>
        <p>{change.before || "Empty"}</p>
      </div>
      <div>
        <small>Saved draft</small>
        <p>{change.after || "Empty"}</p>
      </div>
      <strong>{change.changed ? "Changed" : "Unchanged"}</strong>
    </article>
  );
}

export default async function StudioLiveDraftComparePage({ params }: StudioLiveDraftComparePageProps) {
  const { localizationId } = await params;
  if (!isStudioUuid(localizationId)) notFound();

  const [draft, publication, revisions] = await Promise.all([
    loadStudioDraftEditor(localizationId),
    loadStudioPublicationStatus(localizationId),
    loadStudioRevisionHistory(localizationId),
  ]);
  if (!draft) notFound();

  const backHref = `/studio/content/${draft.localizationId}/edit`;
  const previewHref = `/studio/content/${draft.localizationId}/preview`;
  const baseline = publication
    ? revisions.find((revision) => revision.id === publication.revisionId) ?? null
    : null;

  if (!publication || !baseline) {
    return (
      <main>
        <header className="studio-topbar">
          <div>
            <p className="studio-kicker">Live vs Draft</p>
            <h1 className="studio-title">No published baseline yet</h1>
          </div>
          <div className="studio-content-filter-actions">
            <Link className="studio-content-secondary-link" href={previewHref}>Preview draft</Link>
            <Link className="studio-content-secondary-link" href={backHref}>Back to editor</Link>
          </div>
        </header>
        <section className="studio-panel studio-live-draft-empty">
          <h2>Comparison starts after the first publish</h2>
          <p>Your saved draft is still private. Publish Revision 1 first, then this screen will show exactly what changed before a republish.</p>
        </section>
      </main>
    );
  }

  const comparison = draft.document.ok
    ? buildStudioLiveDraftComparison(baseline, {
        title: draft.title,
        slug: draft.slug,
        summary: draft.summary,
        body: draft.document.document,
      })
    : null;
  const baselineLabel = publication.state === "published" ? "Current live revision" : "Last published revision";
  const liveHref = publication.state === "published" ? `/${draft.locale}/read/${publication.slug}` : null;

  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Live vs Draft</p>
          <h1 className="studio-title">Review changes before republish</h1>
        </div>
        <div className="studio-content-filter-actions">
          {liveHref ? <Link className="studio-content-secondary-link" href={liveHref} target="_blank">Open live Reader</Link> : null}
          <Link className="studio-content-secondary-link" href={previewHref}>Preview draft</Link>
          <Link className="studio-content-secondary-link" href={backHref}>Back to editor</Link>
        </div>
      </header>

      <section className="studio-panel studio-live-draft-hero">
        <div>
          <p className="studio-kicker">Safe review path</p>
          <h2>{baselineLabel} vs saved working draft</h2>
          <p>The published snapshot remains unchanged while you review this difference. This page never writes to Draft, Revision, or Live data.</p>
        </div>
        <dl>
          <div><dt>Language</dt><dd>{studioLocaleLabel(draft.locale)}</dd></div>
          <div><dt>Draft state</dt><dd>{studioEditorialStatusLabel(draft.status)}</dd></div>
          <div><dt>Baseline</dt><dd>Revision {baseline.revisionNumber}</dd></div>
          <div><dt>Public state</dt><dd>{publication.state === "published" ? "Published" : "Archived"}</dd></div>
        </dl>
      </section>

      {!comparison ? (
        <section className="studio-panel studio-content-error">
          <p className="studio-kicker">Comparison blocked safely</p>
          <h2>The saved draft body cannot be compared</h2>
          <p>{draft.document.ok ? "The structured draft could not be normalized for comparison." : draft.document.message}</p>
          <p>The published baseline and private draft are unchanged.</p>
        </section>
      ) : (
        <>
          <section className="studio-panel studio-live-draft-summary" aria-labelledby="live-draft-summary-heading">
            <div>
              <p className="studio-kicker">Edition changes</p>
              <h2 id="live-draft-summary-heading">{comparison.hasChanges ? "Saved draft differs from the published baseline" : "No publishable differences detected"}</h2>
              <p>Current V1 edition comparison covers title, slug, summary and structured Reader blocks. Content-level Subjects are shared and are not editable in this editor checkpoint.</p>
            </div>
            <span data-changed={comparison.hasChanges ? "true" : "false"}>{comparison.hasChanges ? "Changes detected" : "No changes"}</span>
          </section>

          <section className="studio-live-draft-field-grid" aria-label="Metadata comparison">
            <ComparisonField label="Title" change={comparison.title} />
            <ComparisonField label="Slug" change={comparison.slug} />
            <ComparisonField label="Summary" change={comparison.summary} />
          </section>

          <section className="studio-panel studio-live-draft-blocks" aria-labelledby="live-draft-blocks-heading">
            <div>
              <p className="studio-kicker">Structured body</p>
              <h2 id="live-draft-blocks-heading">Reader block changes</h2>
            </div>
            <div className="studio-revision-block-stats">
              <span><strong>{comparison.blocks.beforeCount}</strong> published</span>
              <span><strong>{comparison.blocks.afterCount}</strong> draft</span>
              <span><strong>{comparison.blocks.unchangedCount}</strong> unchanged</span>
              <span><strong>{comparison.blocks.added.length}</strong> added</span>
              <span><strong>{comparison.blocks.removed.length}</strong> removed</span>
              <span><strong>{comparison.blocks.changed.length}</strong> changed</span>
            </div>

            {comparison.blocks.added.length === 0 && comparison.blocks.removed.length === 0 && comparison.blocks.changed.length === 0 ? (
              <p className="studio-revision-muted">No structured body changes.</p>
            ) : (
              <div className="studio-revision-block-change-list">
                {comparison.blocks.added.map((block) => <span key={`added-${block.id}`} data-kind="added">+ {block.type} · {block.id}</span>)}
                {comparison.blocks.removed.map((block) => <span key={`removed-${block.id}`} data-kind="removed">− {block.type} · {block.id}</span>)}
                {comparison.blocks.changed.map((block) => (
                  <span key={`changed-${block.id}`} data-kind="changed">
                    ~ {block.beforeType === block.afterType ? block.afterType : `${block.beforeType} → ${block.afterType}`} · {block.id}
                  </span>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
