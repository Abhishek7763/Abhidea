"use client";

import { useState } from "react";

import {
  finalizeStudioMediaOptimizedVariantAction,
  prepareStudioMediaOptimizedVariantAction,
} from "../actions";
import {
  optimizeStudioMediaImage,
  uploadStudioMediaSignedVariant,
} from "@/features/studio-media-client";

type OptimizationStage = "idle" | "loading" | "optimizing" | "preparing" | "uploading" | "finalizing" | "error";

type MediaOptimizationPanelProps = Readonly<{
  mediaId: string;
  previewUrl: string;
}>;

export function MediaOptimizationPanel({ mediaId, previewUrl }: MediaOptimizationPanelProps) {
  const [stage, setStage] = useState<OptimizationStage>("idle");
  const [message, setMessage] = useState(
    "Create a private WebP copy for faster future Reader delivery. The original remains unchanged.",
  );

  const busy = stage !== "idle" && stage !== "error";

  async function optimize() {
    if (busy) return;

    let source: Blob;
    try {
      setStage("loading");
      setMessage("Loading the private original…");
      const response = await fetch(previewUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("Private preview could not be loaded.");
      source = await response.blob();
    } catch {
      setStage("error");
      setMessage("The private original could not be loaded. Refresh the page and try again.");
      return;
    }

    let optimized;
    try {
      setStage("optimizing");
      setMessage("Optimizing locally to WebP…");
      optimized = await optimizeStudioMediaImage(source);
    } catch {
      setStage("error");
      setMessage("This browser could not create the WebP variant. The original private image is still safe.");
      return;
    }

    setStage("preparing");
    setMessage("Preparing a private optimization ticket…");
    const reservationResult = await prepareStudioMediaOptimizedVariantAction(mediaId);
    if (!reservationResult.ok) {
      setStage("error");
      setMessage(reservationResult.message);
      return;
    }

    const { reservation } = reservationResult;
    let uploadResponse: Response;
    try {
      setStage("uploading");
      setMessage("Uploading optimized WebP to private Storage…");
      uploadResponse = await uploadStudioMediaSignedVariant(
        reservation.signedUploadUrl,
        reservation.publishableKey,
        optimized.blob,
      );
    } catch {
      setStage("error");
      setMessage("Optimization upload was interrupted. Retry safely from this page.");
      return;
    }

    if (!uploadResponse.ok && uploadResponse.status !== 409) {
      setStage("error");
      setMessage(`Storage rejected the optimized variant (${uploadResponse.status}). The original remains unchanged.`);
      return;
    }

    setStage("finalizing");
    setMessage("Saving optimized dimensions and Storage identity…");
    const finalizeResult = await finalizeStudioMediaOptimizedVariantAction(
      mediaId,
      reservation.storageKey,
      optimized.width,
      optimized.height,
    );

    if (!finalizeResult.ok) {
      setStage("error");
      setMessage(finalizeResult.message);
      return;
    }

    window.location.assign(`/studio/media/${mediaId}?optimized=1`);
  }

  return (
    <div className="studio-media-optimization-panel" data-stage={stage}>
      <div>
        <p className="studio-kicker">Web optimization</p>
        <h2>Prepare private WebP</h2>
        <p role="status" aria-live="polite">
          {message}
        </p>
      </div>
      <button type="button" onClick={optimize} disabled={busy}>
        {busy ? "Working…" : stage === "error" ? "Retry optimization" : "Optimize for web"}
      </button>
    </div>
  );
}
