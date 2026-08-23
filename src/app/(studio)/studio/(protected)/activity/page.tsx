import Link from "next/link";

import {
  filterStudioActivityEvents,
  loadStudioActivityEvents,
  normalizeStudioActivityCategory,
  studioActivityDetail,
  studioActivityLabel,
} from "@/features/studio-activity";
import { studioLocaleLabel } from "@/features/studio-content-model";

type StudioActivityPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const categoryLinks = [
  { value: "all", label: "All activity" },
  { value: "writing", label: "Writing" },
  { value: "publishing", label: "Publishing" },
  { value: "lifecycle", label: "Lifecycle" },
] as const;

function formatActivityTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function StudioActivityPage({ searchParams }: StudioActivityPageProps) {
  const rawSearchParams = await searchParams;
  const category = normalizeStudioActivityCategory(rawSearchParams.category);
  const events = await loadStudioActivityEvents();
  const visibleEvents = filterStudioActivityEvents(events, category);

  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Audit trail</p>
          <h1 className="studio-title">Activity</h1>
        </div>
        <span className="studio-status">Read only</span>
      </header>

      <section className="studio-panel studio-activity-intro" aria-labelledby="activity-heading">
        <div>
          <p className="studio-kicker">Phase 11G</p>
          <h2 id="activity-heading">See what changed without changing history</h2>
          <p>
            Studio records draft, publish, archive, Trash and Restore events at the database boundary. Activity is append-only and cannot be edited from Studio.
          </p>
        </div>
        <span>{events.length === 200 ? "Latest 200 events" : `${events.length} recorded event${events.length === 1 ? "" : "s"}`}</span>
      </section>

      <nav className="studio-activity-filters" aria-label="Activity filters">
        {categoryLinks.map((item) => (
          <Link
            key={item.value}
            href={item.value === "all" ? "/studio/activity" : `/studio/activity?category=${item.value}`}
            aria-current={category === item.value ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {visibleEvents.length === 0 ? (
        <section className="studio-panel studio-activity-empty">
          <p className="studio-kicker">No matching events</p>
          <h2>{events.length === 0 ? "Activity starts here" : "Nothing in this filter yet"}</h2>
          <p>
            {events.length === 0
              ? "New Studio actions will appear here automatically. Existing publish revisions are backfilled when the activity migration is applied."
              : "Choose another activity filter to review the rest of the audit trail."}
          </p>
        </section>
      ) : (
        <ol className="studio-activity-list" aria-label="Studio activity timeline">
          {visibleEvents.map((event) => (
            <li className="studio-activity-card" key={event.id} data-event={event.eventType}>
              <div className="studio-activity-card-topline">
                <span className="studio-activity-badge">{studioActivityLabel(event.eventType)}</span>
                <time dateTime={event.occurredAt}>{formatActivityTime(event.occurredAt)}</time>
              </div>

              <div className="studio-activity-copy">
                <h2>{event.title || "Untitled draft"}</h2>
                <p>{studioActivityDetail(event)}</p>
              </div>

              <dl className="studio-activity-meta">
                <div>
                  <dt>Language</dt>
                  <dd>{studioLocaleLabel(event.locale)}</dd>
                </div>
                <div>
                  <dt>Actor</dt>
                  <dd>{event.actorEmail ?? "Studio member"}</dd>
                </div>
                <div>
                  <dt>Slug</dt>
                  <dd>{event.slug ? `/${event.locale}/read/${event.slug}` : "Not set"}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
