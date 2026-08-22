import type { Metadata } from "next";
import Link from "next/link";

import { getTableOfContents } from "./document-schema";
import { ReaderControls } from "./reader-controls";
import { ReaderExperience } from "./reader-experience";
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
  mode?: "public" | "draft-preview";
  backHref?: string;
  previewAlternateHref?: string | null;
}>;

export function ReaderView({
  entry,
  mode = "public",
  backHref = "/studio/content",
  previewAlternateHref = null,
}: ReaderViewProps) {
  const toc = getTableOfContents(entry.body);
  const showToc = toc.length >= 3;
  const isHindi = entry.locale === "hi";
  const isDraftPreview = mode === "draft-preview";
  const alternateHref = isDraftPreview
    ? previewAlternateHref
    : `/${entry.alternateLocale}/read/${entry.alternateSlug}`;
  const typeSlug = contentTypeSlug(entry.contentType);
  const contentTypeHref = typeSlug ? `/explore/type/${typeSlug}` : "/explore";

  return (
    <article
      className={`signature-reader${isDraftPreview ? " reader-draft-preview" : ""}`}
      lang={entry.locale}
      aria-labelledby="reader-title"
    >
      {isDraftPreview ? (
        <aside className="reader-preview-banner" aria-label="Private draft preview">
          <div className="container-page">
            <div>
              <strong>{isHindi ? "निजी ड्राफ्ट पूर्वावलोकन" : "Private draft preview"}</strong>
              <span>
                {isHindi
                  ? "यह सहेजे गए Studio ड्राफ्ट का पूर्वावलोकन है। यह प्रकाशित पेज नहीं है।"
                  : "This renders the saved Studio draft. It is not a published page."}
              </span>
            </div>
            <Link href={backHref}>{isHindi ? "एडिटर पर वापस जाएँ" : "Back to editor"}</Link>
          </div>
        </aside>
      ) : null}

      <header className="reader-header container-page">
        <nav className="reader-breadcrumb" aria-label="Reader breadcrumb">
          {isDraftPreview ? (
            <>
              <Link href="/studio/content">Studio content</Link>
              <span aria-hidden="true">/</span>
              <span>{isHindi ? "ड्राफ्ट पूर्वावलोकन" : "Draft preview"}</span>
            </>
          ) : (
            <>
              <Link href="/explore">Explore</Link>
              <span aria-hidden="true">/</span>
              <Link href={contentTypeHref}>{entry.contentType}</Link>
            </>
          )}
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
                <span className="reader-topic" key={subject}>
                  {subject}
                </span>
              ))}
            </div>
          </div>

          <div className="reader-side-tools">
            <aside className="reader-language-card" aria-label="Reading language">
              <span>{isHindi ? "पढ़ने की भाषा" : "Reading language"}</span>
              <strong>{isHindi ? "हिन्दी" : "English"}</strong>
              {alternateHref ? (
                <Link href={alternateHref} hrefLang={entry.alternateLocale} lang={entry.alternateLocale}>
                  {isDraftPreview
                    ? isHindi
                      ? "English draft preview"
                      : "Hindi draft preview"
                    : isHindi
                      ? "Read in English"
                      : "हिन्दी में पढ़ें"}
                </Link>
              ) : isDraftPreview ? (
                <small>{isHindi ? "English edition अभी उपलब्ध नहीं है" : "Hindi edition is not created yet"}</small>
              ) : null}
            </aside>
            <ReaderControls locale={entry.locale} />
            {isDraftPreview ? null : <ReaderExperience locale={entry.locale} title={entry.title} />}
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

          {entry.sources.length > 0 ? (
            <section className="reader-sources" aria-labelledby="reader-sources-heading">
              <p className="reader-section-label">{isHindi ? "स्रोत" : "Sources"}</p>
              <h2 id="reader-sources-heading">{isHindi ? "संदर्भ और आधार" : "References and basis"}</h2>
              <ol>
                {entry.sources.map((source) => {
                  const sourceUrl = safeExternalUrl(source.url);
                  return (
                    <li key={source.id}>
                      {sourceUrl ? (
                        <a href={sourceUrl} target="_blank" rel="noreferrer">
                          {source.title}
                        </a>
                      ) : (
                        <span>{source.title}</span>
                      )}
                      {source.authorOrOrg ? <small>{source.authorOrOrg}</small> : null}
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : null}
        </div>
      </div>

      {entry.related.length > 0 ? (
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
      ) : null}
    </article>
  );
}
