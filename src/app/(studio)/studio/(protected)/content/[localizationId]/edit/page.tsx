import Link from "next/link";
import { notFound } from "next/navigation";

import { StudioEditorForm } from "@/app/(studio)/studio/(protected)/content/[localizationId]/edit/editor-form";
import { StudioPublishForm } from "@/app/(studio)/studio/(protected)/content/[localizationId]/edit/publish-form";
import {
  isStudioUuid,
  otherStudioContentLocale,
  studioEditorialStatusLabel,
  studioLocaleLabel,
} from "@/features/studio-content-model";
import { loadStudioDraftEditor, loadStudioEditionLinks } from "@/features/studio-editor";
import {
  buildStudioPublishPreflight,
  studioPublicationStateLabel,
  studioRevisionReasonLabel,
} from "@/features/studio-publication-model";
import {
  loadStudioPublicationStatus,
  loadStudioRevisionHistory,
} from "@/features/studio-publication";

type StudioDraftEditPageProps = Readonly<{
  params: Promise<{ localizationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstSearchValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Update time unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function StudioDraftEditPage({ params, searchParams }: StudioDraftEditPageProps) {
  const { localizationId } = await params;
  if (!isStudioUuid(localizationId)) notFound();

  const [draft, publication, revisions] = await Promise.all([
    loadStudioDraftEditor(localizationId),
    loadStudioPublicationStatus(localizationId),
    loadStudioRevisionHistory(localizationId),
  ]);
  if (!draft) notFound();

  const editions = await loadStudioEditionLinks(draft.contentId);
  const counterpartLocale = otherStudioContentLocale(draft.locale);
  const counterpart = editions.find((edition) => edition.locale === counterpartLocale);
  const preflight = buildStudioPublishPreflight(draft);
  const resolvedSearchParams = await searchParams;
  const saved = firstSearchValue(resolvedSearchParams.saved) === "1";
  const linked = firstSearchValue(resolvedSearchParams.linked) === "1";
  const published = firstSearchValue(resolvedSearchParams.published) === "1";

  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Content workflow</p>
          <h1 className="studio-title">Edit draft</h1>
        </div>
        <div className="studio-content-filter-actions">
          <Link className="studio-content-secondary-link" href={`/studio/content/${draft.localizationId}/preview`}>
            Preview draft
          </Link>
          <Link className="studio-content-secondary-link" href="/studio/content">
            Back to content
          </Link>
        </div>
      </header>

      {published ? (
        <div className="studio-content-notice" role="status">
          <strong>Published safely.</strong>
          <span>An immutable revision now owns the live snapshot. The working draft was reset to Draft with a fresh lock version.</span>
        </div>
      ) : linked ? (
        <div className="studio-content-notice" role="status">
          <strong>Linked edition created.</strong>
          <span>This localized draft shares the same logical content identity while keeping its writing independent.</span>
        </div>
      ) : saved ? (
        <div className="studio-content-notice" role="status">
          <strong>Draft saved.</strong>
          <span>Latest private version loaded with conflict protection active.</span>
        </div>
      ) : null}

      <section className="studio-editor-meta" aria-label="Draft identity">
        <div className="studio-content-card-meta">
          <span>{draft.contentType.name}</span>
          <span>{studioLocaleLabel(draft.locale)}</span>
          <span data-status={draft.status}>{studioEditorialStatusLabel(draft.status)}</span>
          <span>Lock v{draft.lockVersion}</span>
        </div>
        <time dateTime={draft.updatedAt}>Updated {formatUpdatedAt(draft.updatedAt)}</time>
      </section>

      <section className="studio-panel studio-publication-safety" aria-labelledby="publication-safety-heading">
        <div>
          <p className="studio-kicker">Publication safety</p>
          <h2 id="publication-safety-heading">Draft and live stay separate</h2>
          <p>
            Saving updates only the private working draft. Publishing creates an immutable revision first, then replaces the live snapshot in the same database transaction.
          </p>
        </div>

        <div className="studio-publication-status" data-state={publication?.state ?? "never-published"}>
          <span>Current live state</span>
          <strong>{publication ? studioPublicationStateLabel(publication.state) : "Never published"}</strong>
          {publication ? (
            <>
              <p>Revision {publication.revisionNumber} owns the current saved live snapshot.</p>
              <dl>
                <div>
                  <dt>Live slug</dt>
                  <dd>{publication.slug}</dd>
                </div>
                <div>
                  <dt>First published</dt>
                  <dd>{formatUpdatedAt(publication.publishedAt)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p>No public snapshot exists for this language edition yet.</p>
          )}
        </div>
      </section>

      <section className="studio-panel studio-revision-history" aria-labelledby="revision-history-heading">
        <div className="studio-revision-history-heading">
          <div>
            <p className="studio-kicker">Revision history</p>
            <h2 id="revision-history-heading">Published snapshots stay immutable</h2>
            <p>
              Every successful publish creates a numbered snapshot. Review an older revision without changing the working draft or current live version.
            </p>
          </div>
          <span>{revisions.length === 0 ? "No revisions yet" : `${revisions.length} saved revision${revisions.length === 1 ? "" : "s"}`}</span>
        </div>

        {revisions.length === 0 ? (
          <div className="studio-revision-empty">
            <strong>History starts with the first publish.</strong>
            <p>Save this draft as Ready and publish it to create Revision 1.</p>
          </div>
        ) : (
          <ol className="studio-revision-list">
            {revisions.map((revision) => {
              const isLive = publication?.revisionId === revision.id;
              return (
                <li key={revision.id} className="studio-revision-card" data-live={isLive ? "true" : "false"}>
                  <div className="studio-revision-card-topline">
                    <div>
                      <strong>Revision {revision.revisionNumber}</strong>
                      <span>{studioRevisionReasonLabel(revision.reason)}</span>
                    </div>
                    {isLive ? <span className="studio-revision-live-badge">Live</span> : null}
                  </div>
                  <p>{revision.snapshot.title}</p>
                  <small>{revision.snapshot.slug}</small>
                  <div className="studio-revision-card-footer">
                    <time dateTime={revision.createdAt}>{formatUpdatedAt(revision.createdAt)}</time>
                    <Link href={`/studio/content/${draft.localizationId}/revisions/${revision.id}`}>
                      Review revision
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="studio-panel studio-publish-preflight" aria-labelledby="publish-preflight-heading">
        <div>
          <p className="studio-kicker">Publish preflight</p>
          <h2 id="publish-preflight-heading">Publish only the saved Ready draft</h2>
          <p>
            The database re-checks membership, lock version, Reader body shape and live slug uniqueness before any revision is committed.
          </p>
        </div>

        {preflight.ready ? (
          <div className="studio-publish-ready">
            <strong>Saved draft passes local preflight.</strong>
            <p>Unsaved editor changes are not included. Publish will re-check the stored draft atomically.</p>
            <StudioPublishForm localizationId={draft.localizationId} lockVersion={draft.lockVersion} />
          </div>
        ) : (
          <div className="studio-publish-blocked">
            <strong>Publish blocked</strong>
            <ul>
              {preflight.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
            <p>Fix these items in the editor, choose Ready, then Save draft. Publish becomes available after reload.</p>
          </div>
        )}
      </section>

      <section className="studio-panel studio-draft-section" aria-labelledby="bilingual-editions-heading">
        <div>
          <p className="studio-kicker">Bilingual editions</p>
          <h2 id="bilingual-editions-heading">English and Hindi stay linked, not duplicated</h2>
          <p>Content Type and Subjects are shared at the logical-content level. Each language keeps its own title, slug, summary, body and editorial state.</p>
        </div>

        <div className="studio-draft-fields">
          <div className="studio-content-card-meta" aria-label="Edition availability">
            <span>{studioLocaleLabel(draft.locale)} — current</span>
            <span>{studioLocaleLabel(counterpartLocale)} — {counterpart ? "available" : "not created"}</span>
          </div>
          <div className="studio-content-filter-actions">
            {counterpart ? (
              <Link className="studio-content-secondary-link" href={`/studio/content/${counterpart.localizationId}/edit`}>
                Open {studioLocaleLabel(counterpartLocale)} edition
              </Link>
            ) : (
              <Link className="studio-content-primary-link" href={`/studio/content/${draft.localizationId}/new-edition`}>
                Add {studioLocaleLabel(counterpartLocale)} edition
              </Link>
            )}
          </div>
        </div>
      </section>

      {draft.document.ok ? (
        <StudioEditorForm
          localizationId={draft.localizationId}
          lockVersion={draft.lockVersion}
          title={draft.title}
          slug={draft.slug}
          summary={draft.summary}
          status={draft.status}
          document={draft.document.document}
        />
      ) : (
        <section className="studio-panel studio-content-error">
          <p className="studio-kicker">Safe editing blocked</p>
          <h2>This draft cannot be edited without risking data loss</h2>
          <p>{draft.document.message}</p>
          <p>The stored draft remains unchanged. Return to the content library or use a later editor checkpoint that supports these blocks.</p>
          <Link className="studio-content-secondary-link" href="/studio/content">Return to content</Link>
        </section>
      )}
    </main>
  );
}
