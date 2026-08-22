export default function StudioDashboardPage() {
  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">ABHIDEA Studio</p>
          <h1 className="studio-title">Creator dashboard</h1>
        </div>
        <span className="studio-status">Security foundation active</span>
      </header>

      <div className="studio-grid">
        <section className="studio-panel">
          <h2>Workspace overview</h2>
          <p>
            Phase 9 is wiring secure creator access before the CMS opens. The public Reader remains isolated from Studio code and private data.
          </p>

          <div className="studio-metric-grid" aria-label="Studio status summary">
            <div className="studio-metric">
              <strong>0</strong>
              <span>Drafts</span>
            </div>
            <div className="studio-metric">
              <strong>0</strong>
              <span>In review</span>
            </div>
            <div className="studio-metric">
              <strong>0</strong>
              <span>Scheduled</span>
            </div>
            <div className="studio-metric">
              <strong>0</strong>
              <span>Published</span>
            </div>
          </div>
        </section>

        <section className="studio-panel">
          <h2>Phase 9 checkpoint</h2>
          <p>Authorization storage and RLS are active. Login/session protection is the next implementation slice.</p>
          <div className="studio-actions">
            <div className="studio-action">
              <div>
                <strong>Supabase authorization</strong>
                <small>Admin / creator role source</small>
              </div>
              <span>Ready</span>
            </div>
            <div className="studio-action">
              <div>
                <strong>Secure sign-in</strong>
                <small>Cookie SSR + server verification</small>
              </div>
              <span>Next</span>
            </div>
            <div className="studio-action">
              <div>
                <strong>Content workspace</strong>
                <small>Draft engine starts in Phase 10</small>
              </div>
              <span>Locked</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
