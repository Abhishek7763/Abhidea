"use client";

import { useActionState } from "react";

import { restoreStudioLocalizationAction } from "@/app/(studio)/studio/(protected)/content/trash/actions";
import type { StudioPublishActionState } from "@/features/studio-publication-model";

const INITIAL_STATE: StudioPublishActionState = {
  status: "idle",
  message: "",
};

type StudioRestoreFormProps = Readonly<{
  localizationId: string;
  lockVersion: number;
}>;

export function StudioRestoreForm({ localizationId, lockVersion }: StudioRestoreFormProps) {
  const [state, formAction, isPending] = useActionState(restoreStudioLocalizationAction, INITIAL_STATE);

  return (
    <form action={formAction}>
      <input type="hidden" name="localizationId" value={localizationId} />
      <input type="hidden" name="expectedLockVersion" value={lockVersion} />

      {state.status !== "idle" ? (
        <p className="studio-publish-error" data-kind={state.status} role="alert">
          {state.message}
        </p>
      ) : null}

      <button className="studio-content-primary-link" type="submit" disabled={isPending}>
        {isPending ? "Restoring…" : "Restore edition"}
      </button>
    </form>
  );
}
