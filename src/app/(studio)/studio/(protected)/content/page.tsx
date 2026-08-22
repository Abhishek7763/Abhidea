import Link from "next/link";

import {
  hasActiveStudioContentFilters,
  normalizeStudioContentFilters,
  studioEditorialStatusLabel,
  studioLocaleLabel,
} from "@/features/studio-content-model";
import { loadStudioContentList } from "@/features/studio-content";

type StudioContentPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Update time unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function firstSearchValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StudioContentPage({ searchParams }: StudioContentPageProps) {
  const rawSearchParams = await searchParams;
  const requestedFilters = normalizeStudioContentFilters(rawSearchParams);
  const data = await loadStudioContentList(requestedFilters);
  const activeFilters = hasActiveStudioContentFilters(data.filters);
  const filteredCount = data.items.length;
  const draftCreated = firstSearchValue(rawSearchParams.created) === "1";

  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Workspace</p>
          <h1 className="studio-title">Content</h1>
        </div>
        <span className="studio-status">CMS connected</span>
      </header>

      {draftCreated ? (
        <div className="studio-content-notice" role="status">
          <strong>Draft saved.</strong>
          <span>The new localized draft is private and now appears in this library.</span>
        </div>
      ) : null}

      <section className="studio-panel studio-content-toolbar" aria-labelledby="draft-library-heading">
        <div className="studio-content-intro">
          <div className="studio-content-intro-heading">
            <div>
              <p className="studio-kicker">Draft library</p>
              <h2 id="draft-library-heading">Manage localized drafts</h2>
            </div>
            <Link className="studio-content-primary-link" href="/studio/content/new">
              New draft
            </Link>
          </div>
          <p>
            Create and filter private CMS drafts through your Studio session and database RLS. Editing opens in the next controlled checkpoint.
          </p>
        </div>

        <form className="studio-content-filters" method="get" action="/studio/content">
          <label>
            <span>Content type</span>
            <select name="type" defaultValue={data.filters.type}>
              <option value="all">All types</option>
              {data.contentTypes.map((type) => (
                <option key={type.id} value={type.slug}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Status</span>
            <select name="status" defaultValue={data.filters.status}>
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="needs_review">Needs review</option>
              <option value="ready">Ready</option>
            </select>
          </label>

          <label>
            <span>Language</span>
            <select name="locale" defaultValue={data.filters.locale}>
              <option value="all">All languages</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </label>

          <div className="studio-content-filter-actions">
            <button type="submit">Apply filters</button>
            {activeFilters ? <Link href="/studio/content">Clear</Link> : null}
          </div>
        </form>
      </section>

      <section className="studio-content-results" aria-label="Content drafts">
        <div className="studio-content-summary">
          <p>
            {data.sourceCount === 0
              ? "Draft library is empty"
              : activeFilters
                ? `${filteredCount} matching draft${filteredCount === 1 ? "" : "s"}`
                : `${data.sourceCount} draft${data.sourceCount === 1 ? "" : "s"}`}
          </p>
          {data.isTruncated ? (
            <span>Showing the {data.loadedCount} most recently updated drafts in this first list window.</span>
          ) : null}
        </div>

        {data.sourceCount === 0 ? (
          <div className="studio-panel studio-content-empty">
            <p className="studio-kicker">Create the first edition</p>
            <h2>No drafts yet</h2>
            <p>The CMS is connected and ready for a private English or Hindi draft.</p>
            <Link className="studio-content-primary-link" href="/studio/content/new">
              Create first draft
            </Link>
          </div>
        ) : filteredCount === 0 ? (
          <div className="studio-panel studio-content-empty">
            <p className="studio-kicker">Filtered view</p>
            <h2>No drafts match these filters</h2>
            <p>Try another combination or clear the filters to return to the full draft library.</p>
            <Link className="studio-content-clear-link" href="/studio/content">
              Clear filters
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
                  <time dateTime={item.updatedAt}>Updated {formatUpdatedAt(item.updatedAt)}</time>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
