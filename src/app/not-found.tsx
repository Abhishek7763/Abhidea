import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page flex min-h-screen items-center py-16">
      <section className="surface-raised mx-auto w-full max-w-2xl p-6 sm:p-9">
        <p className="text-meta">404 · ABHIDEA</p>
        <h1 className="text-title mt-3">This page isn’t here.</h1>
        <p className="mt-5 max-w-xl leading-8 text-muted-foreground">
          The address may have changed, the content may not be published, or the page may not exist.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="button button-primary" href="/">Go home</Link>
          <Link className="button button-secondary" href="/explore">Explore ABHIDEA</Link>
        </div>
      </section>
    </main>
  );
}
