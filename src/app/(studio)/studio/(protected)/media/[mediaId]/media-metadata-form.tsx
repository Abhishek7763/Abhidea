"use client";

import { useActionState } from "react";

import {
  updateStudioMediaMetadataAction,
  type StudioMediaMetadataActionState,
} from "../actions";

const initialState: StudioMediaMetadataActionState = {
  status: "idle",
  message: "",
};

type MediaMetadataFormProps = Readonly<{
  mediaId: string;
  altText: string | null;
  caption: string | null;
  credit: string | null;
  sourceUrl: string | null;
}>;

export function MediaMetadataForm(props: MediaMetadataFormProps) {
  const [state, formAction, pending] = useActionState(updateStudioMediaMetadataAction, initialState);

  return (
    <form className="studio-media-metadata-form" action={formAction}>
      <input type="hidden" name="mediaId" value={props.mediaId} />

      <label>
        <span>Alt text</span>
        <input name="altText" type="text" maxLength={500} defaultValue={props.altText ?? ""} disabled={pending} />
      </label>

      <label>
        <span>Credit</span>
        <input name="credit" type="text" maxLength={500} defaultValue={props.credit ?? ""} disabled={pending} />
      </label>

      <label>
        <span>Source URL</span>
        <input name="sourceUrl" type="url" defaultValue={props.sourceUrl ?? ""} placeholder="https://…" disabled={pending} />
      </label>

      <label>
        <span>Caption</span>
        <textarea name="caption" rows={4} maxLength={2000} defaultValue={props.caption ?? ""} disabled={pending} />
      </label>

      <div className="studio-media-metadata-foot">
        {state.status !== "idle" ? (
          <p role="status" data-status={state.status}>
            {state.message}
          </p>
        ) : (
          <span>Metadata changes stay private in the Media Library.</span>
        )}
        <button type="submit" disabled={pending}>{pending ? "Saving…" : "Save metadata"}</button>
      </div>
    </form>
  );
}
