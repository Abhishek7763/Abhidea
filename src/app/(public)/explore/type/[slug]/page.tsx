import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { contentTypes, readerPreviewItems } from "@/features/website/site-content";

type HubPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

function findType(slug: string) {
  return contentTypes.find((item) => item.slug === slug);
}

export function generateStaticParams() {
  return contentTypes.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: HubPageProps): Promise<Metadata> {
  const { slug } = await params;
  const type = findType(slug);
  if (!type) return {};
  return {
    title: type.label,
    description: `Explore ${type.label.toLowerCase()} on ABHIDEA.`,
  };
}

export default async function ContentTypeHubPage({ params }: HubPageProps) {
  const { slug } = await params;
  const type = findType(slug);
  if (!type) notFound();

  const matchingReads = readerPreviewItems.filter((item) => item.contentTypeSlug === type.slug);

  return (
    <div className="container-page">
      <section className="page-hero">
        <p className="text-meta">Explore by format</p>
        <h1>{type.label}</h1>
        <p>{type.description}</p>
      </section>

      <section className="section-pad pt-0">
        {matchingReads.length > 0 ? (
          <>
            <div className="section-heading-row">
              <div>
                <p className="text-meta">Reader previews</p>
                <h2 className="section-title">Available to read now.</h2>
              </div>
              <p className="section-copy">
                These items are visible test content until Studio publishing becomes the permanent content source.
              </p>
            </div>
            <div className="editorial-grid">
              {matchingReads.map((item, index) => (
                <Link key={item.href} className="editorial-card" href={item.href}>
                  <span className="editorial-card-index">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="text-meta">
                      {item.locale} · {item.readingTime}
                    </p>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-library">
            <h2>No published {type.label.toLowerCase()} yet.</h2>
            <p>This hub is ready and will fill automatically as matching knowledge is published.</p>
            <div className="hero-actions">
              <Link className="button button-secondary" href="/explore">
                Back to Explore
              </Link>
              <Link className="button button-ghost" href="/search">
                Search ABHIDEA
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
