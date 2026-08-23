"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import type { FigureBlock } from "@/features/reader/document-schema";

import {
  loadStudioEditorMediaPickerAction,
  type StudioEditorMediaPickerItem,
} from "./media-picker-actions";
import styles from "./figure-media-picker.module.css";

type FigureMediaPickerProps = Readonly<{
  block: FigureBlock;
  onChange: (next: FigureBlock) => void;
}>;

export function FigureMediaPicker({ block, onChange }: FigureMediaPickerProps) {
  const [items, setItems] = useState<readonly StudioEditorMediaPickerItem[] | null>(null);
  const [message, setMessage] = useState("Choose an optimized image from the private Media Library.");
  const [isPending, startTransition] = useTransition();

  const selected = items?.find((item) => item.id === block.mediaId) ?? null;

  function loadItems() {
    startTransition(async () => {
      const result = await loadStudioEditorMediaPickerAction();
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setItems(result.items);
      setMessage(
        result.items.length > 0
          ? "Select one optimized private image. Metadata stays editable per Figure block."
          : "No optimized images are ready yet. Upload and optimize one in Media Library first.",
      );
    });
  }

  function selectMedia(mediaId: string) {
    const item = items?.find((candidate) => candidate.id === mediaId) ?? null;
    if (!item) {
      onChange({ ...block, mediaId: "", alt: "", caption: undefined, credit: undefined });
      return;
    }

    onChange({
      ...block,
      mediaId: item.id,
      alt: item.altText,
      caption: item.caption || undefined,
      credit: item.credit || undefined,
    });
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <strong>Media Library</strong>
          <p>{message}</p>
        </div>
        {items === null ? (
          <button type="button" onClick={loadItems} disabled={isPending}>
            {isPending ? "Loading…" : "Choose from Media Library"}
          </button>
        ) : (
          <Link href="/studio/media" target="_blank">Open Media Library</Link>
        )}
      </div>

      {items !== null ? (
        <label className={styles.selectField}>
          <span>Selected image</span>
          <select value={block.mediaId} onChange={(event) => selectMedia(event.target.value)}>
            <option value="">Choose an optimized image</option>
            {items.map((item) => (
              <option value={item.id} key={item.id}>{item.filename}</option>
            ))}
          </select>
        </label>
      ) : null}

      {selected ? (
        <div className={styles.preview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.previewUrl} alt={block.alt} />
          <div>
            <strong>{selected.filename}</strong>
            <span>{selected.width} × {selected.height}</span>
            <small>{selected.id}</small>
          </div>
        </div>
      ) : block.mediaId ? (
        <div className={styles.savedIdentity}>
          <strong>Saved Media ID</strong>
          <span>{block.mediaId}</span>
          <small>Load the Media Library to refresh its protected preview.</small>
        </div>
      ) : null}

      <div className="studio-editor-stack">
        <label>
          <span>Alt text</span>
          <input
            value={block.alt}
            maxLength={500}
            placeholder="Required description for accessibility"
            onChange={(event) => onChange({ ...block, alt: event.target.value })}
          />
        </label>
        <label>
          <span>Caption</span>
          <textarea
            rows={3}
            maxLength={2000}
            value={block.caption ?? ""}
            placeholder="Optional visible caption"
            onChange={(event) => onChange({ ...block, caption: event.target.value || undefined })}
          />
        </label>
        <label>
          <span>Credit</span>
          <input
            value={block.credit ?? ""}
            maxLength={500}
            placeholder="Optional image credit"
            onChange={(event) => onChange({ ...block, credit: event.target.value || undefined })}
          />
        </label>
      </div>

      <p className={styles.privacyNote}>
        Figure media remains private in this checkpoint. Articles containing Figure blocks cannot be marked Ready until public media promotion is added.
      </p>
    </div>
  );
}
