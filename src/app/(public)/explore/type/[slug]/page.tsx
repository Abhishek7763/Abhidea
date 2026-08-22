import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { contentTypes } from "@/features/website/site-content";

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

  return (
    <div className="container-page">
      <section className="page-hero">
        <p className="text-meta">Explore by format</p>
        <h1>{type.label}</h1>
        <p>{type.description}</p>
      </section>

      <section className="section-pad pt-0">
        <div className="empty-library">
          <h2>No published {type.label.toLowerCase()} yet.</h2>
          <p>
            This hub is ready and will fill automatically as matching knowledge is published.
          </p>
          <div className="hero-actions">
            <Link className="button button-secondary" href="/explore">Back to Explore</Link>
            <Link className="button button-ghost" href="/search">Search ABHIDEA</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
