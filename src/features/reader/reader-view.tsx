import type { Metadata } from "next";
import Link from "next/link";

import { getTableOfContents } from "./document-schema";
import { ReaderControls } from "./reader-controls";
import { resolveReaderFixtureMedia, type ReaderFixture } from "./reader-fixtures";
import { StructuredDocumentRenderer } from "./structured-document-renderer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://abhidea.vercel.app";

function contentTypeSlug(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeExternalUrl(value?: string): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function buildReaderFixtureMetadata(entry: ReaderFixture): Metadata {
  const currentPath = `/${entry.locale}/read/${entry.slug}`;
  const alternatePath = `/${entry.alternateLocale}/read/${entry.alternateSlug}`;

  return {
    title: entry.title,
    description: entry.summary,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${siteUrl}${currentPath}`,
      languages: {
        [entry.locale]: `${siteUrl}${currentPath}`,
        [entry.alternateLocale]: `${siteUrl}${alternatePath}`,
      },
    },
  };
}

type ReaderViewProps = Readonly<{
  entry: ReaderFixture;
}>;

export function ReaderView({ entry }: ReaderViewProps) {
  const toc = getTableOfContents(entry.body);
  const showToc = toc.length >= 3;
  const isHindi = entry.locale === "hi";
  const alternateHref = `/${entry.alternateLocale}/read/${entry.alternateSlug}`;
  const typeSlug = contentTypeSlug(entry.contentType);
  const contentTypeHref = typeSlug ? `/explore/type/${typeSlug}` : "/explore";

  return (
    <article className="signature-reader" lang={entry.locale} aria-labelledby="reader-title">
      <header className="reader-header container-page">
        <nav className="reader-breadcrumb" aria-label="Reader breadcrumb">
          <Link href="/explore">Explore</Link>
          <span aria-hidden="true">/</span>
          <Link href={contentTypeHref}>{entry.contentType}</Link>
        </nav>

        <div className="reader-header-grid">
          <div>
            <p className="reader-eyebrow">{entry.eyebrow}</p>
            <h1 id="reader-title">{entry.title}</h1>
            <p className="reader-summary">{entry.summary}</p>

            <div className="reader-meta-row" aria-label="Article metadata">
              <span>{entry.contentType}</span>
              <span aria-hidden="true">•</span>
              <span>{entry.readingTime}</span>
              {entry.subjects.map((subject) => (
                <span className="reader-topic" key={subject}>{subject}</span>
              ))}
            </div>
          </div>

          <div className="reader-side-tools">
            <aside className="reader-language-card" aria-label="Reading language">
              <span>{isHindi ? "पढ़ने की भाषा" : "Reading language"}</span>
              <strong>{isHindi ? "हिन्दी" : "English"}</strong>
              <Link href={alternateHref} hrefLang={entry.alternateLocale} lang={entry.alternateLocale}>
                {isHindi ? "Read in English" : "हिन्दी में पढ़ें"}
              </Link>
            </aside>
            <ReaderControls locale={entry.locale} />
          </div>
        </div>
      </header>

      <div className="reader-body-shell container-page">
        {showToc ? (
          <aside className="reader-toc-wrap">
            <nav className="reader-toc" aria-label={isHindi ? "लेख की विषय-सूची" : "Article table of contents"}>
              <p>{isHindi ? "इस लेख में" : "In this article"}</p>
              <ol>
                {toc.map((item) => (
                  <li data-level={item.level} key={item.id}>
                    <a href={`#${item.id}`}>{item.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        ) : null}

        <div className="reader-main-column">
          <StructuredDocumentRenderer
            document={entry.body}
            locale={entry.locale}
            resolveMedia={resolveReaderFixtureMedia}
          />

          <section className="reader-sources" aria-labelledby="reader-sources-heading">
            <p className="reader-section-label">{isHindi ? "स्रोत" : "Sources"}</p>
            <h2 id="reader-sources-heading">{isHindi ? "संदर्भ और आधार" : "References and basis"}</h2>
            <ol>
              {entry.sources.map((source) => {
                const sourceUrl = safeExternalUrl(source.url);
                return (
                  <li key={source.id}>
                    {sourceUrl ? (
                      <a href={sourceUrl} target="_blank" rel="noreferrer">{source.title}</a>
                    ) : (
                      <span>{source.title}</span>
                    )}
                    {source.authorOrOrg ? <small>{source.authorOrOrg}</small> : null}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>

      <section className="reader-related" aria-labelledby="reader-related-heading">
        <div className="container-page">
          <p className="reader-section-label">{isHindi ? "आगे पढ़ें" : "Keep exploring"}</p>
          <h2 id="reader-related-heading">{isHindi ? "संबंधित ज्ञान" : "Related knowledge"}</h2>
          <div className="reader-related-grid">
            {entry.related.map((item) => (
              <Link href={item.href} className="reader-related-card" key={item.href}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
