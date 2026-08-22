import { DesignSystemControls } from "@/components/design-system/design-system-controls";

const foundationItems = [
  "Next.js App Router",
  "Strict TypeScript",
  "Responsive design tokens",
  "Light, Dark & Eye Comfort",
  "English + Hindi typography",
  "Accessible interaction states",
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] opacity-70"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 58%)",
          }}
        />

        <div className="container-page py-6 sm:py-8">
          <header className="flex items-center justify-between gap-4">
            <a href="#top" className="inline-flex items-center gap-3 rounded-full focus-visible:outline-none">
              <span
                className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-white shadow-sm"
                aria-hidden="true"
              >
                A
              </span>
              <span className="text-sm font-bold tracking-[0.18em]">ABHIDEA</span>
            </a>

            <div className="badge gap-2">
              <span className="status-dot" aria-hidden="true" />
              Stable foundation
            </div>
          </header>

          <div id="top" className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
            <div>
              <p className="text-meta mb-5">First stable build</p>
              <h1 className="text-display max-w-4xl text-balance">
                Read. Learn. Think. <span className="text-accent">Grow.</span>
              </h1>
              <p className="text-lead mt-7 max-w-2xl">
                ABHIDEA is being rebuilt as a calm, bilingual knowledge platform with a focused reading experience and a secure publishing foundation.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a className="button button-primary" href="#reader-preview">
                  Preview Reader
                </a>
                <a className="button button-secondary" href="#system-preview">
                  Explore foundation
                </a>
              </div>
            </div>

            <aside className="surface-raised p-5 sm:p-6" aria-label="Foundation build status">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-meta">Build milestone</p>
                  <h2 className="mt-2 text-xl font-semibold">Design System Foundation</h2>
                </div>
                <span className="badge">v0.1</span>
              </div>

              <ul className="mt-6 grid gap-3 text-sm text-muted-foreground">
                {foundationItems.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="status-dot shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section id="system-preview" className="container-page py-14 sm:py-20">
        <div className="mb-8 max-w-2xl">
          <p className="text-meta">Appearance</p>
          <h2 className="text-heading-2 mt-2">A reading-first visual system</h2>
          <p className="mt-4 text-muted-foreground">
            Switch the interface theme below. Reader comfort is previewed independently so long-form reading can stay gentle without changing the whole application.
          </p>
        </div>

        <DesignSystemControls />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="surface p-5 sm:p-6">
            <span className="badge">Semantic colors</span>
            <h3 className="text-heading-3 mt-5">Consistent by design</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Backgrounds, surfaces, borders, text, focus, success, warning and danger states all come from reusable tokens.
            </p>
          </article>

          <article className="surface p-5 sm:p-6">
            <span className="badge">Accessibility</span>
            <h3 className="text-heading-3 mt-5">Keyboard-ready states</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Buttons, links and fields include visible focus treatment, reduced-motion support and readable contrast targets.
            </p>
          </article>

          <article className="surface p-5 sm:p-6">
            <span className="badge">Bilingual</span>
            <h3 className="text-heading-3 mt-5">English + देवनागरी</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground" lang="hi">
              हिन्दी सामग्री के लिए अलग देवनागरी फ़ॉन्ट और पढ़ने योग्य लाइन-हाइट रखी गई है।
            </p>
          </article>
        </div>
      </section>

      <section id="reader-preview" className="border-y border-border bg-[var(--surface-subtle)] py-14 sm:py-20">
        <div className="container-page">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-meta">Reader prototype</p>
              <h2 className="text-heading-2 mt-2">Made for unhurried reading</h2>
            </div>
            <span className="badge self-start sm:self-auto">Bilingual typography test</span>
          </div>

          <article
            className="reader-surface px-5 py-9 sm:px-10 sm:py-12 lg:px-16"
            data-design-reader-preview="true"
          >
            <div className="reader-prose">
              <p className="reader-caption">A short Reader sample · English</p>
              <h2>Knowledge becomes useful when it changes how we notice the world.</h2>
              <p>
                A good reading experience should disappear behind the idea. Calm spacing, a comfortable measure and clear hierarchy help attention stay with the content instead of the interface.
              </p>
              <blockquote>
                The Reader is designed as a place to slow down, understand and return to important ideas.
              </blockquote>

              <div className="my-10 h-px bg-[var(--reader-border)]" aria-hidden="true" />

              <div lang="hi">
                <p className="reader-caption">रीडर नमूना · हिन्दी</p>
                <h2 lang="hi">अच्छी पढ़ाई वही है जिसमें ध्यान डिज़ाइन पर नहीं, विचार पर टिका रहे।</h2>
                <p>
                  आरामदायक अक्षर, संतुलित लाइन-हाइट और साफ़ संरचना लंबे लेख को पढ़ना आसान बनाती है। ABHIDEA का रीडर हिन्दी और अंग्रेज़ी—दोनों भाषाओं को समान महत्व देकर बनाया जा रहा है।
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-meta">Interaction states</p>
            <h2 className="text-heading-2 mt-2">Small details, stable behavior</h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              These basic controls are intentionally simple. They establish the shared visual and accessibility contract before Public, Reader and Studio screens are built on top.
            </p>
          </div>

          <div className="surface-raised grid gap-6 p-5 sm:p-7">
            <div className="flex flex-wrap gap-3">
              <button className="button button-primary" type="button">Primary action</button>
              <button className="button button-secondary" type="button">Secondary</button>
              <button className="button button-ghost" type="button">Ghost</button>
            </div>

            <div>
              <label className="field-label" htmlFor="preview-search">Search preview</label>
              <input
                className="field"
                id="preview-search"
                name="preview-search"
                placeholder="Search articles, books, ideas…"
                type="search"
              />
            </div>

            <div className="callout" data-tone="success">
              <p className="font-semibold">Foundation ready</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The next application screens can now reuse one verified design language instead of inventing styles page by page.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container-page flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>ABHIDEA · Read • Learn • Think • Grow</p>
          <p>Foundation build · 2026</p>
        </div>
      </footer>
    </main>
  );
}
