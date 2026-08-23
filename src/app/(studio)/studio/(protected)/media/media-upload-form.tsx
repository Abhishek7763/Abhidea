"use client";

import { useRef, useState, type FormEvent } from "react";

import {
  cancelStudioMediaUploadAction,
  finalizeStudioMediaUploadAction,
  reserveStudioMediaUploadAction,
} from "./actions";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

type UploadStage = "idle" | "checking" | "preparing" | "uploading" | "finalizing" | "error";

type UploadState = Readonly<{
  stage: UploadStage;
  message: string;
}>;

function bytesStartWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

function asciiSlice(bytes: Uint8Array): string {
  return String.fromCharCode(...bytes);
}

async function hasExpectedImageSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 40).arrayBuffer());

  if (file.type === "image/jpeg") {
    return bytesStartWith(bytes, [0xff, 0xd8, 0xff]);
  }
  if (file.type === "image/png") {
    return bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (file.type === "image/webp") {
    return asciiSlice(bytes.slice(0, 4)) === "RIFF" && asciiSlice(bytes.slice(8, 12)) === "WEBP";
  }
  if (file.type === "image/avif") {
    const ascii = asciiSlice(bytes);
    return asciiSlice(bytes.slice(4, 8)) === "ftyp" && (ascii.includes("avif") || ascii.includes("avis"));
  }

  return false;
}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function MediaUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({
    stage: "idle",
    message: "Choose one image. Draft uploads stay private until a later publish promotion step.",
  });

  const busy = !["idle", "error"].includes(state.stage);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setState({ stage: "error", message: "Choose an image before uploading." });
      return;
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      setState({ stage: "error", message: "Only JPEG, PNG, WebP and AVIF images are supported." });
      return;
    }
    if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
      setState({ stage: "error", message: "Image must be 10 MiB or smaller." });
      return;
    }

    setState({ stage: "checking", message: "Checking image signature…" });
    if (!(await hasExpectedImageSignature(file))) {
      setState({ stage: "error", message: "The selected file does not match its declared image format." });
      return;
    }

    const formData = new FormData(event.currentTarget);
    setState({ stage: "preparing", message: "Preparing a private upload ticket…" });

    const reservationResult = await reserveStudioMediaUploadAction({
      originalFilename: file.name,
      mimeType: file.type,
      byteSize: file.size,
      altText: readText(formData, "altText"),
      caption: readText(formData, "caption"),
      credit: readText(formData, "credit"),
      sourceUrl: readText(formData, "sourceUrl"),
    });

    if (!reservationResult.ok) {
      setState({ stage: "error", message: reservationResult.message });
      return;
    }

    const { reservation } = reservationResult;
    setState({ stage: "uploading", message: "Uploading directly to private Storage…" });

    const uploadBody = new FormData();
    uploadBody.append("cacheControl", "3600");
    uploadBody.append("", file);

    let uploadResponse: Response;
    try {
      uploadResponse = await fetch(reservation.signedUploadUrl, {
        method: "PUT",
        headers: {
          apikey: reservation.publishableKey,
          "x-upsert": "false",
        },
        body: uploadBody,
      });
    } catch {
      await cancelStudioMediaUploadAction(reservation.mediaId, reservation.storageKey).catch(() => undefined);
      setState({ stage: "error", message: "Network upload failed. The staged reservation was cleaned up where possible." });
      return;
    }

    if (!uploadResponse.ok) {
      const cleanup = await cancelStudioMediaUploadAction(reservation.mediaId, reservation.storageKey);
      setState({
        stage: "error",
        message: cleanup.ok
          ? `Storage rejected the upload (${uploadResponse.status}). The staged reservation was cleaned up.`
          : `Storage rejected the upload (${uploadResponse.status}). ${cleanup.message}`,
      });
      return;
    }

    setState({ stage: "finalizing", message: "Finalizing Media Library metadata…" });
    const finalizeResult = await finalizeStudioMediaUploadAction(reservation.mediaId, reservation.storageKey);
    if (!finalizeResult.ok) {
      const cleanup = await cancelStudioMediaUploadAction(reservation.mediaId, reservation.storageKey);
      setState({
        stage: "error",
        message: cleanup.ok ? finalizeResult.message : `${finalizeResult.message} ${cleanup.message}`,
      });
      return;
    }

    formRef.current?.reset();
    window.location.assign("/studio/media?uploaded=1");
  }

  return (
    <form ref={formRef} className="studio-media-upload" onSubmit={handleSubmit}>
      <div className="studio-media-upload-grid">
        <label className="studio-media-file-field">
          <span>Image file</span>
          <input
            ref={fileRef}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={busy}
            required
          />
          <small>JPEG, PNG, WebP or AVIF · maximum 10 MiB</small>
        </label>

        <label>
          <span>Alt text</span>
          <input name="altText" type="text" maxLength={500} placeholder="Describe the image for accessibility" disabled={busy} />
        </label>

        <label>
          <span>Credit</span>
          <input name="credit" type="text" maxLength={500} placeholder="Photographer, author or organization" disabled={busy} />
        </label>

        <label>
          <span>Source URL</span>
          <input name="sourceUrl" type="url" placeholder="https://…" disabled={busy} />
        </label>

        <label className="studio-media-caption-field">
          <span>Caption</span>
          <textarea name="caption" rows={3} maxLength={2000} placeholder="Optional visible caption" disabled={busy} />
        </label>
      </div>

      <div className="studio-media-upload-foot">
        <p className="studio-media-upload-status" data-stage={state.stage} role="status" aria-live="polite">
          {state.message}
        </p>
        <button type="submit" disabled={busy}>
          {busy ? "Working…" : "Upload image"}
        </button>
      </div>
    </form>
  );
}
