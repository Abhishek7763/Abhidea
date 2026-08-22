"use client";

import { useEffect, useRef, useState } from "react";

import { clampPercent, splitSpeechText } from "./reader-experience-utils";

type ReaderLocale = "en" | "hi";
type PlaybackMode = "idle" | "speaking" | "paused";
type ShareState = "idle" | "shared" | "copied" | "error";

type ReaderExperienceProps = Readonly<{
  locale: ReaderLocale;
  title: string;
}>;

const RATE_STORAGE_KEY = "abhidea-reader-speech-rate-v1";
const FOLLOW_STORAGE_KEY = "abhidea-reader-auto-follow-v1";
const rates = [0.85, 1, 1.15] as const;

function isSpeechRate(value: number): value is (typeof rates)[number] {
  return rates.includes(value as (typeof rates)[number]);
}

function getSpeechElements(): HTMLElement[] {
  const article = document.querySelector<HTMLElement>(".signature-reader");
  if (!article) return [];

  return Array.from(
    article.querySelectorAll<HTMLElement>(
      [
        ".reader-header h1",
        ".reader-summary",
        ".reader-document > p",
        ".reader-document h2",
        ".reader-document h3",
        ".reader-document li",
        ".reader-document blockquote",
        ".reader-callout .reader-callout-title",
        ".reader-callout p:not(.reader-callout-title)",
        ".reader-closure > p:not(.reader-closure-label)",
      ].join(","),
    ),
  ).filter((element) => element.innerText.trim().length > 0);
}

function preferredVoice(locale: ReaderLocale): SpeechSynthesisVoice | undefined {
  const languagePrefix = locale === "hi" ? "hi" : "en";
  return window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix));
}

async function copyUrl(url: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      // Fall through to the legacy copy path.
    }
  }

  const input = document.createElement("textarea");
  input.value = url;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();

  try {
    return document.execCommand("copy");
  } finally {
    input.remove();
  }
}

export function ReaderExperience({ locale, title }: ReaderExperienceProps) {
  const [readingProgress, setReadingProgress] = useState(0);
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  const [mode, setMode] = useState<PlaybackMode>("idle");
  const [segmentPosition, setSegmentPosition] = useState({ current: 0, total: 0 });
  const [rate, setRate] = useState<(typeof rates)[number]>(1);
  const [autoFollow, setAutoFollow] = useState(true);
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [speechMessage, setSpeechMessage] = useState("");

  const elementsRef = useRef<HTMLElement[]>([]);
  const currentIndexRef = useRef(0);
  const stoppedRef = useRef(true);
  const rateRef = useRef<(typeof rates)[number]>(1);
  const autoFollowRef = useRef(true);

  const isHindi = locale === "hi";

  useEffect(() => {
    const supported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    const storedRate = Number(localStorage.getItem(RATE_STORAGE_KEY));
    const storedFollow = localStorage.getItem(FOLLOW_STORAGE_KEY);

    if (isSpeechRate(storedRate)) rateRef.current = storedRate;
    if (storedFollow === "false") autoFollowRef.current = false;

    const hydrateTimer = window.setTimeout(() => {
      setSpeechSupported(supported);
      if (isSpeechRate(storedRate)) setRate(storedRate);
      if (storedFollow === "false") setAutoFollow(false);
    }, 0);

    return () => {
      window.clearTimeout(hydrateTimer);
      if (supported) window.speechSynthesis.cancel();
      document.querySelectorAll(".reader-audio-active").forEach((element) => {
        element.classList.remove("reader-audio-active");
      });
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const documentElement = document.querySelector<HTMLElement>(".reader-document");
    if (!documentElement) return;

    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = documentElement.getBoundingClientRect();
        const start = rect.top + window.scrollY - Math.min(140, window.innerHeight * 0.18);
        const end = start + documentElement.offsetHeight - window.innerHeight * 0.5;
        const range = Math.max(1, end - start);
        const rawProgress = ((window.scrollY - start) / range) * 100;
        setReadingProgress(clampPercent(rawProgress));
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateProgress);
    resizeObserver?.observe(documentElement);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      resizeObserver?.disconnect();
    };
  }, []);

  function clearHighlight() {
    elementsRef.current.forEach((element) => element.classList.remove("reader-audio-active"));
  }

  function highlightSegment(index: number) {
    clearHighlight();
    const element = elementsRef.current[index];
    if (!element) return;

    element.classList.add("reader-audio-active");
    setSegmentPosition({ current: index + 1, total: elementsRef.current.length });

    if (autoFollowRef.current) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    }
  }

  function finishSpeech(message = "") {
    stoppedRef.current = true;
    setMode("idle");
    clearHighlight();
    setSpeechMessage(message);
  }

  function speakSegment(index: number, chunkIndex = 0) {
    if (stoppedRef.current || !speechSupported) return;

    const element = elementsRef.current[index];
    if (!element) {
      finishSpeech(isHindi ? "पढ़ना पूरा हुआ।" : "Reading complete.");
      return;
    }

    const chunks = splitSpeechText(element.innerText);
    if (chunks.length === 0) {
      speakSegment(index + 1, 0);
      return;
    }

    if (chunkIndex >= chunks.length) {
      speakSegment(index + 1, 0);
      return;
    }

    currentIndexRef.current = index;
    if (chunkIndex === 0) highlightSegment(index);

    const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
    utterance.lang = isHindi ? "hi-IN" : "en-US";
    utterance.rate = rateRef.current;
    const voice = preferredVoice(locale);
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (stoppedRef.current) return;
      if (chunkIndex + 1 < chunks.length) {
        speakSegment(index, chunkIndex + 1);
      } else {
        speakSegment(index + 1, 0);
      }
    };

    utterance.onerror = (event) => {
      if (stoppedRef.current || event.error === "canceled" || event.error === "interrupted") return;
      finishSpeech(isHindi ? "इस ब्राउज़र में ऑडियो रीडिंग रुक गई।" : "Audio reading stopped in this browser.");
    };

    window.speechSynthesis.speak(utterance);
  }

  function startSpeech() {
    if (!speechSupported) return;

    elementsRef.current = getSpeechElements();
    if (elementsRef.current.length === 0) {
      setSpeechMessage(isHindi ? "पढ़ने के लिए टेक्स्ट नहीं मिला।" : "No readable text was found.");
      return;
    }

    window.speechSynthesis.cancel();
    stoppedRef.current = false;
    currentIndexRef.current = 0;
    setSpeechMessage("");
    setMode("speaking");
    setSegmentPosition({ current: 1, total: elementsRef.current.length });
    window.setTimeout(() => speakSegment(0, 0), 0);
  }

  function togglePlayback() {
    if (!speechSupported) return;

    if (mode === "idle") {
      startSpeech();
      return;
    }

    if (mode === "speaking") {
      window.speechSynthesis.pause();
      setMode("paused");
      return;
    }

    window.speechSynthesis.resume();
    setMode("speaking");
  }

  function stopSpeech() {
    if (!speechSupported) return;
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    setMode("idle");
    clearHighlight();
    setSpeechMessage("");
  }

  function changeRate(nextRate: (typeof rates)[number]) {
    setRate(nextRate);
    rateRef.current = nextRate;
    localStorage.setItem(RATE_STORAGE_KEY, String(nextRate));

    if (!speechSupported || mode === "idle") return;

    const index = currentIndexRef.current;
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    stoppedRef.current = false;
    setMode("speaking");
    window.setTimeout(() => speakSegment(index, 0), 0);
  }

  function toggleAutoFollow() {
    const nextValue = !autoFollow;
    setAutoFollow(nextValue);
    autoFollowRef.current = nextValue;
    localStorage.setItem(FOLLOW_STORAGE_KEY, String(nextValue));
  }

  async function sharePage() {
    setShareState("idle");
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setShareState("shared");
      } else if (await copyUrl(url)) {
        setShareState("copied");
      } else {
        setShareState("error");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareState((await copyUrl(url)) ? "copied" : "error");
    }

    window.setTimeout(() => setShareState("idle"), 2500);
  }

  const text = isHindi
    ? {
        listen: "सुनकर पढ़ें",
        progress: "रीडिंग प्रोग्रेस",
        play: "चलाएँ",
        pause: "रोकें",
        resume: "जारी रखें",
        stop: "बंद करें",
        speed: "गति",
        follow: "ऑटो-फॉलो",
        segment: "भाग",
        share: "शेयर",
        shared: "शेयर हुआ",
        copied: "लिंक कॉपी हुआ",
        shareError: "लिंक कॉपी नहीं हुआ",
        unsupported: "इस ब्राउज़र में टेक्स्ट-टू-स्पीच उपलब्ध नहीं है। आप सामान्य Reader का उपयोग जारी रख सकते हैं।",
      }
    : {
        listen: "Listen & follow",
        progress: "Reading progress",
        play: "Play",
        pause: "Pause",
        resume: "Resume",
        stop: "Stop",
        speed: "Speed",
        follow: "Auto-follow",
        segment: "Segment",
        share: "Share",
        shared: "Shared",
        copied: "Link copied",
        shareError: "Could not copy link",
        unsupported: "Text-to-speech is not available in this browser. The normal Reader remains fully usable.",
      };

  const playbackLabel = mode === "speaking" ? text.pause : mode === "paused" ? text.resume : text.play;
  const shareLabel =
    shareState === "shared"
      ? text.shared
      : shareState === "copied"
        ? text.copied
        : shareState === "error"
          ? text.shareError
          : text.share;

  return (
    <>
      <div className="reader-progress-track" aria-hidden="true">
        <span style={{ width: `${readingProgress}%` }} />
      </div>

      <section className="reader-experience" aria-label={text.listen}>
        <div className="reader-experience-heading">
          <div>
            <span>{text.listen}</span>
            <strong>{readingProgress}%</strong>
          </div>
          <small>{text.progress}</small>
        </div>

        {speechSupported === false ? (
          <p className="reader-speech-fallback">{text.unsupported}</p>
        ) : (
          <>
            <div className="reader-playback-row">
              <button className="reader-playback-primary" type="button" onClick={togglePlayback} disabled={speechSupported === null}>
                <span aria-hidden="true">{mode === "speaking" ? "Ⅱ" : "▶"}</span>
                {playbackLabel}
              </button>
              <button className="reader-playback-stop" type="button" onClick={stopSpeech} disabled={mode === "idle"}>
                <span aria-hidden="true">■</span>
                {text.stop}
              </button>
            </div>

            <div className="reader-speech-meta" aria-live="polite">
              {segmentPosition.total > 0 ? (
                <span>{text.segment} {segmentPosition.current}/{segmentPosition.total}</span>
              ) : (
                <span>{speechMessage || (isHindi ? "ऑडियो तैयार" : "Audio ready")}</span>
              )}
              {speechMessage ? <span>{speechMessage}</span> : null}
            </div>

            <div className="reader-speech-options">
              <div className="reader-rate-control" role="group" aria-label={text.speed}>
                <span>{text.speed}</span>
                <div>
                  {rates.map((option) => (
                    <button key={option} type="button" aria-pressed={rate === option} onClick={() => changeRate(option)}>
                      {option}×
                    </button>
                  ))}
                </div>
              </div>

              <button className="reader-follow-toggle" type="button" aria-pressed={autoFollow} onClick={toggleAutoFollow}>
                <span aria-hidden="true">◎</span>
                {text.follow}
              </button>
            </div>
          </>
        )}

        <button className="reader-share-button" type="button" onClick={sharePage}>
          <span aria-hidden="true">↗</span>
          {shareLabel}
        </button>
      </section>
    </>
  );
}
