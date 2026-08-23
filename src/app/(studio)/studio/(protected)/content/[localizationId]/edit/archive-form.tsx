"use client";

import { useActionState } from "react";

import { archiveStudioPublicationAction } from "@/app/(studio)/studio/(protected)/content/[localizationId]/edit/archive-action";
import styles from "@/app/(studio)/studio/(protected)/content/[localizationId]/edit/archive-form.module.css";
import type { StudioPublishActionState } from "@/features/studio-publication-model";

const INITIAL_STATE: StudioPublishActionState = {
  status: "idle",
  message: "",
};

type StudioArchiveFormProps = Readonly<{
  localizationId: string;
  revisionId: string;
}>;

export function StudioArchiveForm({ localizationId, revisionId }: StudioArchiveFormProps) {
  const [state, formAction, isPending] = useActionState(archiveStudioPublicationAction, INITIAL_STATE);

  return (
    <form className={styles.form} action={formAction}>
      <input type="hidden" name="localizationId" value={localizationId} />
      <input type="hidden" name="expectedRevisionId" value={revisionId} />

      {state.status !== "idle" ? (
        <p className="studio-publish-error" data-kind={state.status} role="alert">
          {state.message}
        </p>
      ) : null}

      <label className={styles.confirm}>
        <input type="checkbox" name="confirmArchive" value="yes" required />
        <span>I understand this will remove the current Reader page from public access.</span>
      </label>

      <button className={styles.button} type="submit" disabled={isPending}>
        {isPending ? "Archiving…" : "Unpublish & archive"}
      </button>
      <small className={styles.note}>Revision history and the private working draft are preserved. You can republish later from a saved Ready draft.</small>
    </form>
  );
}
