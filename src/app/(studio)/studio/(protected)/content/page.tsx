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

export default async function StudioContentPage({ searchParams }: StudioContentPageProps) {
  const requestedFilters = normalizeStudioContentFilters(await searchParams);
  const data = await loadStudioContentList(requestedFilters);
  const activeFilters = hasActiveStudioContentFilters(data.filters);
  const filteredCount = data.items.length;

  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Workspace</p>
          <h1 className="studio-title">Content</h1>
        </div>
        <span className="studio-status">CMS connected</span>
      </header>

      <section className="studio-panel studio-content-toolbar" aria-labelledby="draft-library-heading">
        <div className="studio-content-intro">
          <p className="studio-kicker">Draft library</p>
          <h2 id="draft-library-heading">Manage localized drafts</h2>
          <p>
            This list reads the private Phase 10 CMS through your Studio session and database RLS. Creation and editing open in the next checkpoint.
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
            <p className="studio-kicker">Ready for Phase 10C</p>
            <h2>No drafts yet</h2>
            <p>
              The permanent CMS is connected and ready. The next checkpoint adds the New Content flow and Save Draft action.
            </p>
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
