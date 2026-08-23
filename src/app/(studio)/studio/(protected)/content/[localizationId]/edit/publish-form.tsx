"use client";

import { useActionState } from "react";

import { publishStudioDraftAction } from "@/app/(studio)/studio/(protected)/content/actions";
import type { StudioPublishActionState } from "@/features/studio-publish-action-model";

const INITIAL_STATE: StudioPublishActionState = {
  status: "idle",
  message: "",
};

type StudioPublishFormProps = Readonly<{
  localizationId: string;
  lockVersion: number;
}>;

export function StudioPublishForm({ localizationId, lockVersion }: StudioPublishFormProps) {
  const [state, formAction, isPending] = useActionState(publishStudioDraftAction, INITIAL_STATE);
  const verificationPending = state.status === "pending";

  return (
    <form className="studio-publish-form" action={formAction}>
      <input type="hidden" name="localizationId" value={localizationId} />
      <input type="hidden" name="expectedLockVersion" value={lockVersion} />
      {state.status !== "idle" ? (
        <p
          className="studio-publish-error"
          data-kind={state.status}
          role={verificationPending ? "status" : "alert"}
        >
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={isPending || verificationPending}>
        {isPending
          ? "Publishing…"
          : verificationPending
            ? "Published — verification pending"
            : "Publish saved draft"}
      </button>
      <span>Creates an immutable revision and replaces the live snapshot atomically.</span>
    </form>
  );
}
