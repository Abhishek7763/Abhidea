import Link from "next/link";

import { contentTypes, readerPreviewItems, subjects } from "@/features/website/site-content";

export const metadata = {
  title: "Explore",
  description: "Browse ABHIDEA by knowledge format and subject.",
};

export default function ExplorePage() {
  return (
    <div className="container-page">
      <section className="page-hero">
        <p className="text-meta">Explore ABHIDEA</p>
        <h1>Browse ideas your way.</h1>
        <p>
          Explore is for discovery: choose a knowledge format or a broad subject, then follow the connections that interest you.
        </p>
      </section>

      <section className="section-pad" aria-labelledby="available-reading-heading">
        <div className="section-heading-row">
          <div>
            <p className="text-meta">Available reads</p>
            <h2 id="available-reading-heading" className="section-title">
              Open a Reader preview.
            </h2>
          </div>
          <p className="section-copy">
            These bilingual previews are already readable while the permanent Studio publishing workflow is being developed.
          </p>
        </div>
        <div className="editorial-grid">
          {readerPreviewItems.map((item, index) => (
            <Link key={item.href} className="editorial-card" href={item.href}>
              <span className="editorial-card-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p className="text-meta">
                  {item.locale} · {item.contentType} · {item.readingTime}
                </p>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-pad" aria-labelledby="explore-format-heading">
        <div className="section-heading-row">
          <div>
            <p className="text-meta">By format</p>
            <h2 id="explore-format-heading" className="section-title">
              What do you want to read?
            </h2>
          </div>
        </div>
        <div className="editorial-grid">
          {contentTypes.map((type, index) => (
            <Link key={type.slug} className="editorial-card" href={`/explore/type/${type.slug}`}>
              <span className="editorial-card-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{type.label}</h3>
                <p>{type.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-pad" aria-labelledby="explore-subject-heading">
        <div className="section-heading-row">
          <div>
            <p className="text-meta">By subject</p>
            <h2 id="explore-subject-heading" className="section-title">
              What are you curious about?
            </h2>
          </div>
        </div>
        <div className="subject-grid">
          {subjects.map((subject) => (
            <Link key={subject.slug} className="subject-pill" href={`/explore/subject/${subject.slug}`}>
              {subject.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
