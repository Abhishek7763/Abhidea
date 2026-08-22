import Link from "next/link";

import { StudioDraftForm } from "@/app/(studio)/studio/(protected)/content/new/draft-form";
import { loadStudioDraftCreateOptions } from "@/features/studio-content";

export default async function StudioNewDraftPage() {
  const options = await loadStudioDraftCreateOptions();

  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Content workflow</p>
          <h1 className="studio-title">New draft</h1>
        </div>
        <Link className="studio-content-secondary-link" href="/studio/content">
          Back to content
        </Link>
      </header>

      <section className="studio-draft-intro" aria-labelledby="new-draft-heading">
        <div>
          <p className="studio-kicker">Phase 10C</p>
          <h2 id="new-draft-heading">Create a private localized draft</h2>
          <p>
            Save the first working edition without publishing anything. Editing, autosave and review controls remain separate checkpoints.
          </p>
        </div>
        <span>Transactional save</span>
      </section>

      {options.contentTypes.length === 0 ? (
        <section className="studio-panel studio-content-empty">
          <p className="studio-kicker">Creation unavailable</p>
          <h2>No active Content Types</h2>
          <p>An active Studio administrator must restore at least one Content Type before a draft can be created.</p>
        </section>
      ) : (
        <StudioDraftForm contentTypes={options.contentTypes} subjects={options.subjects} />
      )}
    </main>
  );
}
