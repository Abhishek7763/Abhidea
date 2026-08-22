import Link from "next/link";

type SearchPageProps = Readonly<{
  searchParams: Promise<{ q?: string | string[] }>;
}>;

export const metadata = {
  title: "Search",
  description: "Search published ABHIDEA knowledge.",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = rawQuery?.trim() ?? "";

  return (
    <div className="container-page">
      <section className="page-hero">
        <p className="text-meta">Search</p>
        <h1>Find what you came to learn.</h1>
        <p>
          Search and Explore are intentionally different: Search is for a question or phrase you already have; Explore is for browsing what exists.
        </p>
      </section>

      <section className="section-pad pt-0">
        <form className="search-form" action="/search" method="get" role="search">
          <label className="visually-hidden" htmlFor="site-search">Search ABHIDEA</label>
          <input
            className="field"
            id="site-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search ideas, books, science, AI…"
            autoComplete="off"
          />
          <button className="button button-primary" type="submit">Search</button>
        </form>

        <div className="mt-8 empty-library" aria-live="polite">
          {query ? (
            <>
              <h2>No published matches for “{query}” yet.</h2>
              <p>
                The public library is still being populated. Try a broader term or browse by format and subject instead.
              </p>
            </>
          ) : (
            <>
              <h2>Start with a word, question or topic.</h2>
              <p>
                As published knowledge is added, this page will search titles, summaries, body text and relevant metadata.
              </p>
            </>
          )}
          <div className="hero-actions">
            <Link className="button button-secondary" href="/explore">Explore the library</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
