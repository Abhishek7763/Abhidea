import Link from "next/link";
import { notFound } from "next/navigation";

import { StudioArchiveForm } from "@/app/(studio)/studio/(protected)/content/[localizationId]/edit/archive-form";
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
  const archived = firstSearchValue(resolvedSearchParams.archived) === "1";
  const liveHref = publication?.state === "published" ? `/${draft.locale}/read/${publication.slug}` : null;
  const workflowStage = archived || publication?.state === "archived" ? "archived" : published ? "published" : preflight.ready ? "ready" : "editing";

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
          {liveHref ? (
            <Link className="studio-content-secondary-link" href={liveHref} target="_blank">
              View live
            </Link>
          ) : null}
          <Link className="studio-content-secondary-link" href="/studio/content">
            Back to content
          </Link>
        </div>
      </header>

      {archived ? (
        <div className="studio-content-notice" role="status">
          <strong>Publication archived.</strong>
          <span>The public Reader is offline. Immutable revisions and the private working draft are preserved.</span>
        </div>
      ) : published ? (
        <div className="studio-content-notice studio-publish-success-notice" role="status">
          <div>
            <strong>Published successfully.</strong>
            <span>An immutable revision now owns the live snapshot. The working draft has safely returned to Draft.</span>
          </div>
          {liveHref ? <Link href={liveHref} target="_blank">View live Reader</Link> : null}
        </div>
      ) : linked ? (
        <div className="studio-content-notice" role="status">
          <strong>Linked edition created.</strong>
          <span>This localized draft shares the same logical content identity while keeping its writing independent.</span>
        </div>
      ) : saved && draft.status === "ready" ? (
        <div className="studio-content-notice studio-ready-saved-notice" role="status">
          <div>
            <strong>Ready saved — Publish is unlocked.</strong>
            <span>The saved draft passed the local readiness gate. Review the preflight and publish when you are ready.</span>
          </div>
          <a href="#publish-preflight-heading">Go to Publish</a>
        </div>
      ) : saved ? (
        <div className="studio-content-notice" role="status">
          <strong>Draft saved privately.</strong>
          <span>Nothing was published. Mark the editorial state Ready and save again when the content is complete.</span>
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

      <section className="studio-panel studio-publish-workflow" data-stage={workflowStage} aria-labelledby="publish-workflow-heading">
        <div className="studio-publish-workflow-heading">
          <div>
            <p className="studio-kicker">Publish workflow</p>
            <h2 id="publish-workflow-heading">
              {publication?.state === "archived"
                ? "Archived — public Reader is offline"
                : published
                  ? "Published — open the live Reader"
                  : preflight.ready
                    ? "Ready to publish"
                    : "Finish the draft, then mark it Ready"}
            </h2>
            <p>Publishing is deliberately separate from saving. Archiving removes public access without deleting the draft or immutable revisions.</p>
          </div>
          <span>{publication?.state === "archived" ? "Archived" : published ? "Live" : preflight.ready ? "Ready" : studioEditorialStatusLabel(draft.status)}</span>
        </div>

        <ol className="studio-publish-steps" aria-label="Publish steps">
          <li data-state="complete"><span>1</span><div><strong>Draft</strong><small>Write and save privately</small></div></li>
          <li data-state={draft.status === "ready" || preflight.ready || published ? "complete" : "current"}><span>2</span><div><strong>Mark Ready</strong><small>Choose Ready in Draft details</small></div></li>
          <li data-state={preflight.ready || published ? "complete" : draft.status === "ready" ? "current" : "upcoming"}><span>3</span><div><strong>Save Ready</strong><small>Reload with stored readiness</small></div></li>
          <li data-state={publication?.state === "archived" ? "upcoming" : published ? "complete" : preflight.ready ? "current" : "upcoming"}><span>4</span><div><strong>Publish</strong><small>Create revision + live snapshot</small></div></li>
          <li data-state={liveHref ? "complete" : "upcoming"}><span>5</span><div><strong>View live</strong><small>{publication?.state === "archived" ? "Offline until republished" : "Open the public Reader"}</small></div></li>
        </ol>

        <div className="studio-publish-workflow-action">
          {liveHref ? (
            <Link href={liveHref} target="_blank">View live Reader</Link>
          ) : preflight.ready ? (
            <a href="#publish-preflight-heading">{publication?.state === "archived" ? "Republish archived edition" : "Continue to Publish"}</a>
          ) : (
            <a href="#editor-details-heading">{publication?.state === "archived" ? "Prepare to republish" : "Mark Ready & Save"}</a>
          )}
          <span>{publication?.state === "archived" ? "The last revision is preserved. Save a Ready draft and Publish to restore public access." : preflight.ready ? "The saved draft is ready. Unsaved editor changes are not included." : "Saving a normal Draft never publishes it."}</span>
        </div>
      </section>

      <section className="studio-panel studio-publish-preflight" aria-labelledby="publish-preflight-heading">
        <div>
          <p className="studio-kicker">Publish preflight</p>
          <h2 id="publish-preflight-heading">{preflight.ready ? "Saved draft is ready to publish" : "Publish is still locked"}</h2>
          <p>The database re-checks membership, lock version, Reader body shape and live slug uniqueness before any revision is committed.</p>
        </div>

        {preflight.ready ? (
          <div className="studio-publish-ready">
            <strong>{publication?.state === "archived" ? "Ready to restore public access." : "All local blockers are cleared."}</strong>
            <p>Press Publish below to create a new immutable revision and live snapshot. Unsaved editor changes are never included.</p>
            <StudioPublishForm localizationId={draft.localizationId} lockVersion={draft.lockVersion} />
          </div>
        ) : (
          <div className="studio-publish-blocked">
            <strong>Publish blocked</strong>
            <ul>{preflight.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul>
            <a className="studio-publish-fix-link" href="#editor-details-heading">Fix in Draft details</a>
            <p>Choose Ready, complete any missing content, then press Save as Ready. Publish unlocks after the page reloads.</p>
          </div>
        )}
      </section>

      <section className="studio-panel studio-publication-safety" aria-labelledby="publication-safety-heading">
        <div>
          <p className="studio-kicker">Publication safety</p>
          <h2 id="publication-safety-heading">Draft and live stay separate</h2>
          <p>Saving updates only the private working draft. Publishing creates an immutable revision first. Archiving only changes public visibility.</p>
        </div>

        <div className="studio-publication-status" data-state={publication?.state ?? "never-published"}>
          <span>Current live state</span>
          <strong>{publication ? studioPublicationStateLabel(publication.state) : "Never published"}</strong>
          {publication ? (
            <>
              <p>{publication.state === "published" ? `Revision ${publication.revisionNumber} owns the current live snapshot.` : `Revision ${publication.revisionNumber} is preserved, but this edition is not publicly readable.`}</p>
              <dl>
                <div><dt>Reserved slug</dt><dd>{publication.slug}</dd></div>
                <div><dt>First published</dt><dd>{formatUpdatedAt(publication.publishedAt)}</dd></div>
                <div><dt>State updated</dt><dd>{formatUpdatedAt(publication.updatedAt)}</dd></div>
              </dl>
              {liveHref ? <Link className="studio-publication-live-link" href={liveHref} target="_blank">Open live Reader</Link> : null}
              {publication.state === "published" ? <StudioArchiveForm localizationId={draft.localizationId} revisionId={publication.revisionId} /> : <p>To restore this page, mark the working draft Ready, save it, then Publish again.</p>}
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
            <p>Every successful publish creates a numbered snapshot. Archive never deletes these revisions.</p>
          </div>
          <span>{revisions.length === 0 ? "No revisions yet" : `${revisions.length} saved revision${revisions.length === 1 ? "" : "s"}`}</span>
        </div>

        {revisions.length === 0 ? (
          <div className="studio-revision-empty"><strong>History starts with the first publish.</strong><p>Save this draft as Ready and publish it to create Revision 1.</p></div>
        ) : (
          <ol className="studio-revision-list">
            {revisions.map((revision) => {
              const isLive = publication?.state === "published" && publication.revisionId === revision.id;
              const isArchivedSource = publication?.state === "archived" && publication.revisionId === revision.id;
              return (
                <li key={revision.id} className="studio-revision-card" data-live={isLive ? "true" : "false"}>
                  <div className="studio-revision-card-topline">
                    <div><strong>Revision {revision.revisionNumber}</strong><span>{studioRevisionReasonLabel(revision.reason)}</span></div>
                    {isLive ? <span className="studio-revision-live-badge">Live</span> : isArchivedSource ? <span className="studio-revision-live-badge">Archived</span> : null}
                  </div>
                  <p>{revision.snapshot.title}</p>
                  <small>{revision.snapshot.slug}</small>
                  <div className="studio-revision-card-footer">
                    <time dateTime={revision.createdAt}>{formatUpdatedAt(revision.createdAt)}</time>
                    <Link href={`/studio/content/${draft.localizationId}/revisions/${revision.id}`}>Review revision</Link>
                  </div>
                </li>
              );
            })}
          </ol>
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
            {counterpart ? <Link className="studio-content-secondary-link" href={`/studio/content/${counterpart.localizationId}/edit`}>Open {studioLocaleLabel(counterpartLocale)} edition</Link> : <Link className="studio-content-primary-link" href={`/studio/content/${draft.localizationId}/new-edition`}>Add {studioLocaleLabel(counterpartLocale)} edition</Link>}
          </div>
        </div>
      </section>

      {draft.document.ok ? (
        <StudioEditorForm localizationId={draft.localizationId} lockVersion={draft.lockVersion} title={draft.title} slug={draft.slug} summary={draft.summary} status={draft.status} document={draft.document.document} />
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
