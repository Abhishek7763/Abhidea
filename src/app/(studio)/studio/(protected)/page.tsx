export default function StudioDashboardPage() {
  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">ABHIDEA Studio</p>
          <h1 className="studio-title">Creator dashboard</h1>
        </div>
        <span className="studio-status">Secure session active</span>
      </header>

      <div className="studio-grid">
        <section className="studio-panel">
          <h2>Workspace overview</h2>
          <p>
            Studio access is now protected by Supabase Auth and an active admin or creator membership. Operational draft data arrives in the next CMS phase.
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
          <h2>Phase 9 security status</h2>
          <p>Private Studio access is enforced before any content-management capability is opened.</p>
          <div className="studio-actions">
            <div className="studio-action">
              <div>
                <strong>Supabase authentication</strong>
                <small>Server-side password sign-in</small>
              </div>
              <span>Active</span>
            </div>
            <div className="studio-action">
              <div>
                <strong>Role verification</strong>
                <small>RLS-backed admin / creator membership</small>
              </div>
              <span>Active</span>
            </div>
            <div className="studio-action">
              <div>
                <strong>Content workspace</strong>
                <small>Draft engine begins in Phase 10</small>
              </div>
              <span>Next</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
