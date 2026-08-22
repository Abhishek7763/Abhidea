export default function StudioContentPage() {
  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Workspace</p>
          <h1 className="studio-title">Content</h1>
        </div>
        <span className="studio-status">Protected</span>
      </header>

      <section className="studio-panel studio-empty-state">
        <p className="studio-kicker">Phase 10</p>
        <h2>Draft engine comes next</h2>
        <p>
          Articles, book summaries, facts, thoughts, ideas, life lessons, guides and video insights will be created and managed here after the CMS data model is activated.
        </p>
      </section>
    </main>
  );
}
