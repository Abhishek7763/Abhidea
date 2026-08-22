import Image from "next/image";

import { creatorProfile } from "@/features/website/site-content";

export const metadata = {
  title: "About",
  description: "About the creator of ABHIDEA and the learning philosophy behind the project.",
};

function CreatorVisual() {
  const photos = [creatorProfile.photos.primary, creatorProfile.photos.secondary].filter(
    (value): value is string => Boolean(value),
  );

  if (photos.length === 0) {
    return <div className="creator-monogram" aria-label={`${creatorProfile.name} profile image placeholder`}>AB</div>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {photos.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={`${creatorProfile.name} portrait ${index + 1}`}
          width={720}
          height={900}
          className="h-auto w-full rounded-[var(--radius-xl)] object-cover"
          priority={index === 0}
        />
      ))}
    </div>
  );
}

export default function AboutPage() {
  const hasSocialLinks = creatorProfile.socialLinks.some((item) => Boolean(item.href));

  return (
    <div className="container-page">
      <section className="page-hero">
        <p className="text-meta">{creatorProfile.label}</p>
        <h1>{creatorProfile.headline}</h1>
        <p>{creatorProfile.intro}</p>
      </section>

      <section className="section-pad about-grid">
        <aside className="about-profile-card">
          <CreatorVisual />
          <div className="mt-5">
            <p className="text-meta">{creatorProfile.tagline}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{creatorProfile.name}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{creatorProfile.role}</p>
            <p className="mt-1 text-sm text-muted-foreground">{creatorProfile.location}</p>
          </div>

          {hasSocialLinks ? (
            <div className="social-links" aria-label="Creator social links">
              {creatorProfile.socialLinks.map((item) =>
                item.href ? (
                  <a key={item.label} href={item.href} rel="noreferrer" target="_blank">
                    {item.label}
                  </a>
                ) : null,
              )}
            </div>
          ) : null}
        </aside>

        <div className="about-details">
          <section className="about-block">
            <p className="text-meta">Why ABHIDEA</p>
            <h2>A place to learn before it is a place to publish.</h2>
            <p>{creatorProfile.whyAbhidea}</p>
          </section>

          <section className="about-block">
            <p className="text-meta">Learning philosophy</p>
            <h2>Read, question, connect, then share.</h2>
            <p>{creatorProfile.philosophy}</p>
          </section>

          <section className="about-block">
            <p className="text-meta">Background</p>
            <h2>Engineering, curiosity and continuous learning.</h2>
            <ul className="meta-list">
              <li><strong>Education:</strong> {creatorProfile.education}</li>
              <li><strong>Profession:</strong> {creatorProfile.role}</li>
              <li><strong>Current interests:</strong> {creatorProfile.interests.join(" • ")}</li>
            </ul>
          </section>
        </div>
      </section>
    </div>
  );
}
