"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createStudioLinkedEditionAction } from "@/app/(studio)/studio/(protected)/content/actions";
import {
  studioLocaleLabel,
  type StudioContentLocale,
  type StudioDraftCreateState,
} from "@/features/studio-content-model";

const INITIAL_STATE: StudioDraftCreateState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

type StudioLinkedEditionFormProps = Readonly<{
  sourceLocalizationId: string;
  sourceLocale: StudioContentLocale;
  targetLocale: StudioContentLocale;
  contentTypeName: string;
}>;

function FieldError({ message }: Readonly<{ message?: string }>) {
  return message ? <span className="studio-draft-field-error">{message}</span> : null;
}

export function StudioLinkedEditionForm({
  sourceLocalizationId,
  sourceLocale,
  targetLocale,
  contentTypeName,
}: StudioLinkedEditionFormProps) {
  const [state, formAction, isPending] = useActionState(createStudioLinkedEditionAction, INITIAL_STATE);

  return (
    <form className="studio-draft-form" action={formAction}>
      <input type="hidden" name="sourceLocalizationId" value={sourceLocalizationId} />
      <input type="hidden" name="locale" value={targetLocale} />

      {state.status === "error" ? (
        <div className="studio-draft-form-error" role="alert">
          {state.message}
        </div>
      ) : null}

      <section className="studio-panel studio-draft-section" aria-labelledby="edition-identity-heading">
        <div>
          <p className="studio-kicker">Shared identity</p>
          <h2 id="edition-identity-heading">Same content, new language edition</h2>
          <p>
            Content Type and Subjects stay shared. Title, slug, summary and body below belong only to the new localized edition.
          </p>
        </div>

        <div className="studio-draft-fields studio-draft-fields-two">
          <label>
            <span>Content type</span>
            <input value={contentTypeName} readOnly aria-readonly="true" />
          </label>
          <label>
            <span>Edition link</span>
            <input
              value={`${studioLocaleLabel(sourceLocale)} → ${studioLocaleLabel(targetLocale)}`}
              readOnly
              aria-readonly="true"
            />
          </label>
        </div>
      </section>

      <section className="studio-panel studio-draft-section" aria-labelledby="edition-details-heading">
        <div>
          <p className="studio-kicker">Localized details</p>
          <h2 id="edition-details-heading">{studioLocaleLabel(targetLocale)} title and summary</h2>
          <p>
            Write this edition independently. ABHIDEA will not copy the other language&apos;s title, summary or body into this draft.
          </p>
        </div>

        <div className="studio-draft-fields">
          <label>
            <span>Title</span>
            <input name="title" type="text" maxLength={180} autoComplete="off" required />
            <FieldError message={state.fieldErrors.title} />
          </label>

          <label>
            <span>Slug</span>
            <input
              name="slug"
              type="text"
              maxLength={180}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Auto-generate from localized title"
            />
            <small>Each language keeps its own draft slug. Live URL uniqueness is enforced later at publish preflight.</small>
            <FieldError message={state.fieldErrors.slug} />
          </label>

          <label>
            <span>Summary</span>
            <textarea name="summary" rows={4} maxLength={1200} />
            <FieldError message={state.fieldErrors.summary} />
          </label>
        </div>
      </section>

      <section className="studio-panel studio-draft-section" aria-labelledby="edition-body-heading">
        <div>
          <p className="studio-kicker">Localized body</p>
          <h2 id="edition-body-heading">Starter structured content</h2>
          <p>
            Separate paragraphs with a blank line. They become ABHIDEA paragraph blocks; the source edition remains unchanged.
          </p>
        </div>

        <div className="studio-draft-fields">
          <label>
            <span>Body</span>
            <textarea
              className="studio-draft-body"
              name="body"
              rows={16}
              maxLength={120000}
              placeholder={`Write the ${studioLocaleLabel(targetLocale)} edition here…`}
            />
            <FieldError message={state.fieldErrors.body} />
          </label>
        </div>
      </section>

      <div className="studio-draft-savebar">
        <div>
          <strong>Private linked edition</strong>
          <span>This creates only the missing language draft. Nothing is published or copied automatically.</span>
        </div>
        <div className="studio-draft-save-actions">
          <Link href={`/studio/content/${sourceLocalizationId}/edit`}>Cancel</Link>
          <button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : `Create ${studioLocaleLabel(targetLocale)} edition`}
          </button>
        </div>
      </div>
    </form>
  );
}
