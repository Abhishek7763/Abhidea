import Link from "next/link";

import { contentTypes, creatorProfile, readerPreviewItems } from "@/features/website/site-content";

export default function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container-page hero-grid">
          <div>
            <p className="hero-kicker">Read • Learn • Think • Grow</p>
            <h1 className="hero-title">
              Ideas worth <span className="hero-title-accent">understanding.</span>
            </h1>
            <p className="hero-copy">
              ABHIDEA is a calm knowledge space for reading deeply, connecting useful ideas, and turning curiosity into something you can remember and apply.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/explore">
                Explore knowledge
              </Link>
              <Link className="button button-secondary" href="/about">
                About the creator
              </Link>
            </div>
          </div>

          <aside className="hero-note" aria-label="ABHIDEA reading principle">
            <p className="hero-note-label">Reading principle</p>
            <p>A good reading experience should disappear behind the idea.</p>
          </aside>
        </div>
      </section>

      <section className="container-page section-pad" aria-labelledby="featured-reading-heading">
        <div className="section-heading-row">
          <div>
            <p className="text-meta">Available now</p>
            <h2 id="featured-reading-heading" className="section-title">
              Read inside ABHIDEA.
            </h2>
          </div>
          <p className="section-copy">
            These bilingual Reader previews are available for testing while the Studio publishing workflow is being built.
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

      <section className="container-page section-pad" aria-labelledby="formats-heading">
        <div className="section-heading-row">
          <div>
            <p className="text-meta">Knowledge formats</p>
            <h2 id="formats-heading" className="section-title">
              Different ways to learn.
            </h2>
          </div>
          <p className="section-copy">
            Long-form explanations, compact facts, book learning, practical guides and reflective ideas all live in one structured library.
          </p>
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

      <section className="reader-promise">
        <div className="container-page section-pad reader-promise-grid">
          <div>
            <p className="text-meta">The Reader</p>
            <h2 className="section-title">Knowledge stays calm.</h2>
            <p className="section-copy">
              ABHIDEA is being shaped around a reading-first experience: generous spacing, bilingual typography, clear structure and optional comfort tools without clutter.
            </p>
          </div>

          <div className="reader-promise-card">
            <p>The goal is not to make reading feel impressive. It is to make the idea easier to follow, question and remember.</p>
            <p lang="hi">
              उद्देश्य पढ़ने को दिखावटी बनाना नहीं, बल्कि विचार को समझना, उस पर सोचना और उसे याद रखना आसान बनाना है।
            </p>
          </div>
        </div>
      </section>

      <section className="container-page section-pad creator-teaser" aria-labelledby="creator-heading">
        <div className="creator-monogram" aria-hidden="true">
          AB
        </div>
        <div>
          <p className="text-meta">{creatorProfile.label}</p>
          <h2 id="creator-heading" className="section-title">
            {creatorProfile.headline}
          </h2>
          <p className="section-copy">{creatorProfile.intro}</p>
          <div className="hero-actions">
            <Link className="button button-secondary" href="/about">
              Meet {creatorProfile.shortName}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
