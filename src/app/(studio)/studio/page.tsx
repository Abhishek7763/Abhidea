import Link from "next/link";

export default function StudioLandingPage() {
  return (
    <main className="container-page flex min-h-screen items-center py-16">
      <section className="surface-raised mx-auto w-full max-w-xl p-6 sm:p-8">
        <p className="text-meta">ABHIDEA Studio</p>
        <h1 className="text-title mt-3">Private workspace</h1>
        <p className="mt-5 leading-8 text-muted-foreground">
          Studio is reserved for secure creator and admin access. No private content or draft data is exposed on this public milestone.
        </p>
        <div className="callout mt-6">
          <p className="font-semibold">Secure sign-in is not enabled yet.</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Authentication and role-verified Studio access will be activated before the operational CMS is opened.
          </p>
        </div>
        <div className="mt-7">
          <Link className="button button-secondary" href="/">Return to ABHIDEA</Link>
        </div>
      </section>
    </main>
  );
}
