"use client";

type StudioContentErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function StudioContentError({ reset }: StudioContentErrorProps) {
  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Workspace</p>
          <h1 className="studio-title">Content</h1>
        </div>
      </header>

      <section className="studio-panel studio-content-error" role="alert">
        <p className="studio-kicker">CMS connection</p>
        <h2>Draft library could not load</h2>
        <p>
          No draft was changed. Retry the secure read; if your session has expired, Studio authentication will handle the next navigation.
        </p>
        <button type="button" onClick={reset}>
          Retry
        </button>
      </section>
    </main>
  );
}
