import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { subjects } from "@/features/website/site-content";

type HubPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

function findSubject(slug: string) {
  return subjects.find((item) => item.slug === slug);
}

export function generateStaticParams() {
  return subjects.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: HubPageProps): Promise<Metadata> {
  const { slug } = await params;
  const subject = findSubject(slug);
  if (!subject) return {};
  return {
    title: subject.label,
    description: `Explore ${subject.label} knowledge on ABHIDEA.`,
  };
}

export default async function SubjectHubPage({ params }: HubPageProps) {
  const { slug } = await params;
  const subject = findSubject(slug);
  if (!subject) notFound();

  return (
    <div className="container-page">
      <section className="page-hero">
        <p className="text-meta">Explore by subject</p>
        <h1>{subject.label}</h1>
        <p>Browse published ABHIDEA knowledge connected to {subject.label}.</p>
      </section>

      <section className="section-pad pt-0">
        <div className="empty-library">
          <h2>No published items in this subject yet.</h2>
          <p>
            This subject hub is ready and will fill as matching knowledge is published.
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
