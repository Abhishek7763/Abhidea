export default function StudioMediaPage() {
  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Workspace</p>
          <h1 className="studio-title">Media</h1>
        </div>
        <span className="studio-status">Protected</span>
      </header>

      <section className="studio-panel studio-empty-state">
        <p className="studio-kicker">Planned workspace</p>
        <h2>Media library is not open yet</h2>
        <p>
          Image selection, upload, metadata and reusable media records will be added only after the content workflow has a stable draft model.
        </p>
      </section>
    </main>
  );
}
