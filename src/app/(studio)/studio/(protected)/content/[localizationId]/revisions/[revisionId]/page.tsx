import Link from "next/link";
import { notFound } from "next/navigation";

import { isStudioUuid, studioLocaleLabel } from "@/features/studio-content-model";
import {
  buildStudioRevisionComparison,
  studioRevisionReasonLabel,
  type StudioRevisionFieldChange,
} from "@/features/studio-publication-model";
import {
  loadStudioPublicationStatus,
  loadStudioRevisionHistory,
} from "@/features/studio-publication";

type StudioRevisionPageProps = Readonly<{
  params: Promise<{ localizationId: string; revisionId: string }>;
}>;

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function RevisionField({ label, change }: Readonly<{ label: string; change: StudioRevisionFieldChange }>) {
  return (
    <article className="studio-revision-field" data-changed={change.changed ? "true" : "false"}>
      <span>{label}</span>
      {change.changed ? (
        <>
          <div>
            <small>Previous</small>
            <p>{change.before || "Empty"}</p>
          </div>
          <div>
            <small>Selected revision</small>
            <p>{change.after || "Empty"}</p>
          </div>
        </>
      ) : (
        <p>{change.after || "Empty"}</p>
      )}
      <strong>{change.changed ? "Changed" : "Unchanged"}</strong>
    </article>
  );
}

export default async function StudioRevisionPage({ params }: StudioRevisionPageProps) {
  const { localizationId, revisionId } = await params;
  if (!isStudioUuid(localizationId) || !isStudioUuid(revisionId)) notFound();

  const [revisions, publication] = await Promise.all([
    loadStudioRevisionHistory(localizationId),
    loadStudioPublicationStatus(localizationId),
  ]);
  const selected = revisions.find((revision) => revision.id === revisionId);
  if (!selected) notFound();

  const previous = revisions.find(
    (revision) => revision.revisionNumber === selected.revisionNumber - 1,
  ) ?? null;
  const comparison = previous ? buildStudioRevisionComparison(previous, selected) : null;
  const isLive = publication?.revisionId === selected.id && publication.state === "published";

  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Revision review</p>
          <h1 className="studio-title">Revision {selected.revisionNumber}</h1>
        </div>
        <div className="studio-content-filter-actions">
          {isLive ? (
            <Link
              className="studio-content-secondary-link"
              href={`/${selected.snapshot.locale}/read/${selected.snapshot.slug}`}
            >
              Open live Reader
            </Link>
          ) : null}
          <Link
            className="studio-content-secondary-link"
            href={`/studio/content/${localizationId}/edit`}
          >
            Back to editor
          </Link>
        </div>
      </header>

      <section className="studio-panel studio-revision-review-hero">
        <div>
          <p className="studio-kicker">Immutable snapshot</p>
          <h2>{selected.snapshot.title}</h2>
          <p>
            This is a read-only publication record. Reviewing it cannot change the draft or the current live snapshot.
          </p>
        </div>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>{isLive ? "Current live revision" : "Historical revision"}</dd>
          </div>
          <div>
            <dt>Reason</dt>
            <dd>{studioRevisionReasonLabel(selected.reason)}</dd>
          </div>
          <div>
            <dt>Language</dt>
            <dd>{studioLocaleLabel(selected.snapshot.locale)}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatTimestamp(selected.createdAt)}</dd>
          </div>
          <div>
            <dt>Slug</dt>
            <dd>{selected.snapshot.slug}</dd>
          </div>
          <div>
            <dt>Content type</dt>
            <dd>{selected.snapshot.contentType.name}</dd>
          </div>
        </dl>
      </section>

      {comparison && previous ? (
        <>
          <section className="studio-panel studio-revision-compare" aria-labelledby="revision-compare-heading">
            <div className="studio-revision-section-heading">
              <div>
                <p className="studio-kicker">Compare</p>
                <h2 id="revision-compare-heading">Changes from Revision {previous.revisionNumber}</h2>
                <p>
                  Metadata and structured blocks are compared by their saved immutable values and stable block IDs.
                </p>
              </div>
              <span data-changed={comparison.hasChanges ? "true" : "false"}>
                {comparison.hasChanges ? "Changes detected" : "No saved changes"}
              </span>
            </div>

            <div className="studio-revision-field-grid">
              <RevisionField label="Title" change={comparison.title} />
              <RevisionField label="Slug" change={comparison.slug} />
              <RevisionField label="Summary" change={comparison.summary} />
            </div>
          </section>

          <section className="studio-panel studio-revision-diff-grid" aria-label="Revision structured differences">
            <article>
              <p className="studio-kicker">Subjects</p>
              <h2>Taxonomy changes</h2>
              {comparison.subjects.added.length === 0 && comparison.subjects.removed.length === 0 ? (
                <p className="studio-revision-muted">No Subject changes.</p>
              ) : (
                <div className="studio-revision-change-groups">
                  {comparison.subjects.added.length > 0 ? (
                    <div>
                      <strong>Added</strong>
                      <ul>
                        {comparison.subjects.added.map((subject) => (
                          <li key={`added-${subject.slug}`}>{subject.name}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {comparison.subjects.removed.length > 0 ? (
                    <div>
                      <strong>Removed</strong>
                      <ul>
                        {comparison.subjects.removed.map((subject) => (
                          <li key={`removed-${subject.slug}`}>{subject.name}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </article>

            <article>
              <p className="studio-kicker">Structured body</p>
              <h2>Block changes</h2>
              <div className="studio-revision-block-stats">
                <span><strong>{comparison.blocks.beforeCount}</strong> previous</span>
                <span><strong>{comparison.blocks.afterCount}</strong> selected</span>
                <span><strong>{comparison.blocks.unchangedCount}</strong> unchanged</span>
                <span><strong>{comparison.blocks.added.length}</strong> added</span>
                <span><strong>{comparison.blocks.removed.length}</strong> removed</span>
                <span><strong>{comparison.blocks.changed.length}</strong> changed</span>
              </div>

              {comparison.blocks.added.length === 0 &&
              comparison.blocks.removed.length === 0 &&
              comparison.blocks.changed.length === 0 ? (
                <p className="studio-revision-muted">No structured body changes.</p>
              ) : (
                <div className="studio-revision-block-change-list">
                  {comparison.blocks.added.map((block) => (
                    <span key={`added-${block.id}`} data-kind="added">+ {block.type} · {block.id}</span>
                  ))}
                  {comparison.blocks.removed.map((block) => (
                    <span key={`removed-${block.id}`} data-kind="removed">− {block.type} · {block.id}</span>
                  ))}
                  {comparison.blocks.changed.map((block) => (
                    <span key={`changed-${block.id}`} data-kind="changed">
                      ~ {block.beforeType === block.afterType ? block.afterType : `${block.beforeType} → ${block.afterType}`} · {block.id}
                    </span>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      ) : (
        <section className="studio-panel studio-revision-baseline">
          <p className="studio-kicker">Revision baseline</p>
          <h2>This is the first published revision</h2>
          <p>There is no earlier immutable snapshot to compare with Revision 1.</p>
        </section>
      )}

      <section className="studio-panel studio-revision-snapshot-summary">
        <div>
          <p className="studio-kicker">Selected snapshot</p>
          <h2>Saved publication structure</h2>
          <p>The full body remains immutable in revision storage. This checkpoint summarizes its saved structure without exposing restore controls.</p>
        </div>
        <dl>
          <div>
            <dt>Body blocks</dt>
            <dd>{selected.snapshot.body.blocks.length}</dd>
          </div>
          <div>
            <dt>Subjects</dt>
            <dd>{selected.snapshot.subjects.length}</dd>
          </div>
          <div>
            <dt>Schema</dt>
            <dd>Reader v{selected.snapshot.body.schemaVersion}</dd>
          </div>
          <div>
            <dt>Editorial state at publish</dt>
            <dd>Ready</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
