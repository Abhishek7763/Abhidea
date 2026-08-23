"use client";

import { useActionState } from "react";

import { trashStudioLocalizationAction } from "@/app/(studio)/studio/(protected)/content/trash/actions";
import styles from "@/app/(studio)/studio/(protected)/content/[localizationId]/edit/archive-form.module.css";
import type { StudioPublishActionState } from "@/features/studio-publication-model";

const INITIAL_STATE: StudioPublishActionState = {
  status: "idle",
  message: "",
};

type StudioTrashFormProps = Readonly<{
  localizationId: string;
  lockVersion: number;
  expectedLiveRevisionId: string | null;
  isPublished: boolean;
}>;

export function StudioTrashForm({
  localizationId,
  lockVersion,
  expectedLiveRevisionId,
  isPublished,
}: StudioTrashFormProps) {
  const [state, formAction, isPending] = useActionState(trashStudioLocalizationAction, INITIAL_STATE);

  return (
    <form className={styles.form} action={formAction}>
      <input type="hidden" name="localizationId" value={localizationId} />
      <input type="hidden" name="expectedLockVersion" value={lockVersion} />
      <input type="hidden" name="expectedLiveRevisionId" value={expectedLiveRevisionId ?? ""} />

      {state.status !== "idle" ? (
        <p className="studio-publish-error" data-kind={state.status} role="alert">
          {state.message}
        </p>
      ) : null}

      <label className={styles.confirm}>
        <input type="checkbox" name="confirmTrash" value="yes" required />
        <span>
          {isPublished
            ? "I understand this will archive the current public Reader page and move only this language edition to Trash."
            : "I understand this will move only this language edition out of the active Studio library."}
        </span>
      </label>

      <button className={styles.button} type="submit" disabled={isPending}>
        {isPending ? "Moving to Trash…" : "Move edition to Trash"}
      </button>
      <small className={styles.note}>
        Draft data, bilingual content identity, publication snapshots and immutable revisions are preserved. Restore never auto-publishes.
      </small>
    </form>
  );
}
