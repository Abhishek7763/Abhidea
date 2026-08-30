import Image from "next/image";

import {
  parseReaderDocument,
  type FigureBlock,
  type ReaderLocale,
  type ReaderResolvedMedia,
} from "./document-schema";

export type ResolvedReaderMedia = ReaderResolvedMedia;

type StructuredDocumentRendererProps = Readonly<{
  document: unknown;
  locale: ReaderLocale;
  resolveMedia: (mediaId: string) => ResolvedReaderMedia | null;
}>;

function ReaderFigure({ block, media }: { block: FigureBlock; media: ResolvedReaderMedia | null }) {
  if (!media) {
    return (
      <aside className="reader-block-warning" role="note">
        <p>{block.alt}</p>
      </aside>
    );
  }

  return (
    <figure className="reader-figure">
      <Image
        src={media.src}
        alt={block.alt}
        width={media.width}
        height={media.height}
        sizes="(max-width: 760px) calc(100vw - 2rem), 720px"
      />
      {block.caption || block.credit ? (
        <figcaption>
          {block.caption ? <span>{block.caption}</span> : null}
          {block.credit ? <span className="reader-figure-credit">{block.credit}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function StructuredDocumentRenderer({ document: input, locale, resolveMedia }: StructuredDocumentRendererProps) {
  const parsed = parseReaderDocument(input);

  if (!parsed.schemaSupported || parsed.document.blocks.length === 0) {
    return (
      <div className="reader-block-warning" role="status">
        <p>{locale === "hi" ? "यह सामग्री अभी दिखाई नहीं जा सकती।" : "This content cannot be displayed yet."}</p>
      </div>
    );
  }

  return (
    <div className="reader-document">
      {parsed.document.blocks.map((block) => {
        switch (block.type) {
          case "paragraph":
            return <p key={block.id}>{block.text}</p>;
          case "heading": {
            const id = `section-${block.id}`;
            return block.level === 2 ? (
              <h2 id={id} key={block.id}>{block.text}</h2>
            ) : (
              <h3 id={id} key={block.id}>{block.text}</h3>
            );
          }
          case "quote":
            return (
              <figure className="reader-quote" key={block.id}>
                <blockquote>{block.text}</blockquote>
                {block.attribution ? <figcaption>— {block.attribution}</figcaption> : null}
              </figure>
            );
          case "list": {
            const items = block.items.map((item, index) => <li key={`${block.id}-${index}`}>{item}</li>);
            return block.style === "ordered" ? <ol key={block.id}>{items}</ol> : <ul key={block.id}>{items}</ul>;
          }
          case "callout":
            return (
              <aside className="reader-callout" data-tone={block.tone} key={block.id}>
                {block.title ? <p className="reader-callout-title">{block.title}</p> : null}
                <p>{block.text}</p>
              </aside>
            );
          case "figure":
            return (
              <ReaderFigure
                block={block}
                key={block.id}
                media={parsed.document.media?.[block.mediaId] ?? resolveMedia(block.mediaId)}
              />
            );
          case "divider":
            return <hr className="reader-divider" key={block.id} />;
          case "closure":
            return (
              <section className="reader-closure" data-variant={block.variant} key={block.id}>
                <p className="reader-closure-label">
                  {block.variant === "abhidea-take" ? "ABHIDEA’s Take" : locale === "hi" ? "निष्कर्ष" : "Conclusion"}
                </p>
                <h2>{block.title}</h2>
                <p>{block.text}</p>
              </section>
            );
        }
      })}
    </div>
  );
}
