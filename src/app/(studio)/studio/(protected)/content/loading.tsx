export default function StudioContentLoading() {
  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Workspace</p>
          <h1 className="studio-title">Content</h1>
        </div>
      </header>

      <section className="studio-panel studio-content-loading" aria-live="polite">
        <p className="studio-kicker">Secure CMS</p>
        <h2>Loading draft library…</h2>
        <p>Reading your private content workspace through the active Studio session.</p>
      </section>
    </main>
  );
}
