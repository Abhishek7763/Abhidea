export default function StudioSettingsPage() {
  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Workspace</p>
          <h1 className="studio-title">Settings</h1>
        </div>
        <span className="studio-status">Protected</span>
      </header>

      <section className="studio-panel studio-empty-state">
        <p className="studio-kicker">Security first</p>
        <h2>Operational settings stay locked</h2>
        <p>
          Site configuration, About editing and creator preferences will be introduced after authentication and the CMS foundation are fully verified.
        </p>
      </section>
    </main>
  );
}
