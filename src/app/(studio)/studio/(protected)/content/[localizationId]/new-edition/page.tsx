import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { StudioLinkedEditionForm } from "@/app/(studio)/studio/(protected)/content/[localizationId]/new-edition/linked-edition-form";
import {
  isStudioUuid,
  otherStudioContentLocale,
  studioLocaleLabel,
} from "@/features/studio-content-model";
import { loadStudioDraftEditor, loadStudioEditionLinks } from "@/features/studio-editor";

type StudioNewEditionPageProps = Readonly<{
  params: Promise<{ localizationId: string }>;
}>;

export default async function StudioNewEditionPage({ params }: StudioNewEditionPageProps) {
  const { localizationId } = await params;
  if (!isStudioUuid(localizationId)) notFound();

  const sourceDraft = await loadStudioDraftEditor(localizationId);
  if (!sourceDraft) notFound();

  const targetLocale = otherStudioContentLocale(sourceDraft.locale);
  const editions = await loadStudioEditionLinks(sourceDraft.contentId);
  const existingTarget = editions.find((edition) => edition.locale === targetLocale);

  if (existingTarget?.lifecycleState === "active") {
    redirect(`/studio/content/${existingTarget.localizationId}/edit`);
  }

  if (existingTarget?.lifecycleState === "trashed") {
    redirect("/studio/content/trash");
  }

  return (
    <main>
      <header className="studio-topbar">
        <div>
          <p className="studio-kicker">Bilingual workflow</p>
          <h1 className="studio-title">Add {studioLocaleLabel(targetLocale)} edition</h1>
        </div>
        <Link className="studio-content-secondary-link" href={`/studio/content/${localizationId}/edit`}>
          Back to source draft
        </Link>
      </header>

      <section className="studio-draft-intro" aria-labelledby="linked-edition-heading">
        <div>
          <p className="studio-kicker">Phase 10E</p>
          <h2 id="linked-edition-heading">Link English and Hindi without mixing their writing</h2>
          <p>
            The new {studioLocaleLabel(targetLocale)} draft will share the same logical content identity as this {studioLocaleLabel(sourceDraft.locale)} edition. Localized writing stays independent.
          </p>
        </div>
        <span>Bilingual identity</span>
      </section>

      <StudioLinkedEditionForm
        sourceLocalizationId={sourceDraft.localizationId}
        sourceLocale={sourceDraft.locale}
        targetLocale={targetLocale}
        contentTypeName={sourceDraft.contentType.name}
      />
    </main>
  );
}
