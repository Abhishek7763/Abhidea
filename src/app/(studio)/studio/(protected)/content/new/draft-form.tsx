"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createStudioDraftAction } from "@/app/(studio)/studio/(protected)/content/actions";
import type {
  StudioContentTypeOption,
  StudioDraftCreateState,
  StudioSubjectOption,
} from "@/features/studio-content-model";

const INITIAL_STATE: StudioDraftCreateState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

type StudioDraftFormProps = Readonly<{
  contentTypes: readonly StudioContentTypeOption[];
  subjects: readonly StudioSubjectOption[];
}>;

function FieldError({ message }: Readonly<{ message?: string }>) {
  return message ? <span className="studio-draft-field-error">{message}</span> : null;
}

export function StudioDraftForm({ contentTypes, subjects }: StudioDraftFormProps) {
  const [state, formAction, isPending] = useActionState(createStudioDraftAction, INITIAL_STATE);

  return (
    <form className="studio-draft-form" action={formAction}>
      {state.status === "error" ? (
        <div className="studio-draft-form-error" role="alert">
          {state.message}
        </div>
      ) : null}

      <section className="studio-panel studio-draft-section" aria-labelledby="draft-basics-heading">
        <div>
          <p className="studio-kicker">Step 1</p>
          <h2 id="draft-basics-heading">Draft basics</h2>
          <p>Choose the permanent content identity and language for this edition.</p>
        </div>

        <div className="studio-draft-fields studio-draft-fields-two">
          <label>
            <span>Content type</span>
            <select name="contentTypeId" defaultValue={contentTypes[0]?.id} required>
              {contentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <FieldError message={state.fieldErrors.contentTypeId} />
          </label>

          <label>
            <span>Language</span>
            <select name="locale" defaultValue="en" required>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
            <FieldError message={state.fieldErrors.locale} />
          </label>
        </div>
      </section>

      <section className="studio-panel studio-draft-section" aria-labelledby="draft-details-heading">
        <div>
          <p className="studio-kicker">Step 2</p>
          <h2 id="draft-details-heading">Title and summary</h2>
          <p>Slug can be left blank; ABHIDEA will derive a Unicode-safe slug from the title on save.</p>
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
              placeholder="Auto-generate from title"
            />
            <small>Draft slugs may temporarily conflict; publication preflight will enforce the live URL rule.</small>
            <FieldError message={state.fieldErrors.slug} />
          </label>

          <label>
            <span>Summary</span>
            <textarea name="summary" rows={4} maxLength={1200} />
            <FieldError message={state.fieldErrors.summary} />
          </label>
        </div>
      </section>

      <section className="studio-panel studio-draft-section" aria-labelledby="draft-subjects-heading">
        <div>
          <p className="studio-kicker">Step 3</p>
          <h2 id="draft-subjects-heading">Subjects</h2>
          <p>Subjects are optional working taxonomy and are shared by English/Hindi editions of the same content.</p>
        </div>

        {subjects.length === 0 ? (
          <div className="studio-draft-inline-empty">
            No active Subjects exist yet. You can save this draft now and attach Subjects later.
          </div>
        ) : (
          <fieldset className="studio-draft-subjects">
            <legend className="visually-hidden">Choose up to 12 subjects</legend>
            {subjects.map((subject) => (
              <label key={subject.id}>
                <input type="checkbox" name="subjectIds" value={subject.id} />
                <span>{subject.name}</span>
              </label>
            ))}
          </fieldset>
        )}
        <FieldError message={state.fieldErrors.subjectIds} />
      </section>

      <section className="studio-panel studio-draft-section" aria-labelledby="draft-body-heading">
        <div>
          <p className="studio-kicker">Step 4</p>
          <h2 id="draft-body-heading">Starter body</h2>
          <p>
            Separate paragraphs with a blank line. On save they become ABHIDEA structured paragraph blocks; raw HTML is never stored as the canonical body.
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
              placeholder="Write the first draft here…"
            />
            <FieldError message={state.fieldErrors.body} />
          </label>
        </div>
      </section>

      <div className="studio-draft-savebar">
        <div>
          <strong>Private draft only</strong>
          <span>This action does not publish, schedule, or change the public Reader.</span>
        </div>
        <div className="studio-draft-save-actions">
          <Link href="/studio/content">Cancel</Link>
          <button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save draft"}
          </button>
        </div>
      </div>
    </form>
  );
}
