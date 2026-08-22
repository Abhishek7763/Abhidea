"use client";

import { useEffect, useSyncExternalStore } from "react";

type ReaderFont = "small" | "standard" | "large";
type ReaderSpacing = "compact" | "standard" | "relaxed";
type ReaderWidth = "narrow" | "standard" | "wide";

type ReaderSettings = Readonly<{
  font: ReaderFont;
  spacing: ReaderSpacing;
  width: ReaderWidth;
  comfort: boolean;
}>;

type ReaderControlsProps = Readonly<{
  locale: "en" | "hi";
}>;

type Listener = () => void;

const STORAGE_KEY = "abhidea-reader-settings-v1";
const listeners = new Set<Listener>();
const defaultSettings: ReaderSettings = {
  font: "standard",
  spacing: "standard",
  width: "standard",
  comfort: false,
};
const defaultSnapshot = JSON.stringify(defaultSettings);

function isReaderFont(value: unknown): value is ReaderFont {
  return value === "small" || value === "standard" || value === "large";
}

function isReaderSpacing(value: unknown): value is ReaderSpacing {
  return value === "compact" || value === "standard" || value === "relaxed";
}

function isReaderWidth(value: unknown): value is ReaderWidth {
  return value === "narrow" || value === "standard" || value === "wide";
}

function parseSettings(value: string): ReaderSettings {
  try {
    const parsed = JSON.parse(value) as Partial<ReaderSettings>;
    return {
      font: isReaderFont(parsed.font) ? parsed.font : defaultSettings.font,
      spacing: isReaderSpacing(parsed.spacing) ? parsed.spacing : defaultSettings.spacing,
      width: isReaderWidth(parsed.width) ? parsed.width : defaultSettings.width,
      comfort: typeof parsed.comfort === "boolean" ? parsed.comfort : defaultSettings.comfort,
    };
  } catch {
    return defaultSettings;
  }
}

function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) ?? defaultSnapshot;
}

function getServerSnapshot(): string {
  return defaultSnapshot;
}

function subscribe(listener: Listener) {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };

  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

function applyAttributes(settings: ReaderSettings) {
  const root = document.documentElement;
  root.dataset.readerFont = settings.font;
  root.dataset.readerSpacing = settings.spacing;
  root.dataset.readerWidth = settings.width;

  if (settings.comfort) {
    root.dataset.readerTheme = "comfort";
  } else {
    delete root.dataset.readerTheme;
  }
}

function saveSettings(settings: ReaderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  applyAttributes(settings);
  emit();
}

function SegmentedButtons<T extends string>({
  label,
  value,
  values,
  labels,
  onChange,
}: Readonly<{
  label: string;
  value: T;
  values: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}>) {
  return (
    <div className="reader-setting-group" role="group" aria-label={label}>
      <span>{label}</span>
      <div className="reader-setting-options">
        {values.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {labels[option]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReaderControls({ locale }: ReaderControlsProps) {
  const rawSettings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const settings = parseSettings(rawSettings);
  const isHindi = locale === "hi";

  useEffect(() => {
    applyAttributes(settings);
  }, [settings]);

  function update(next: Partial<ReaderSettings>) {
    saveSettings({ ...settings, ...next });
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    applyAttributes(defaultSettings);
    emit();
  }

  const text = isHindi
    ? {
        summary: "रीडर सेटिंग्स",
        font: "अक्षर आकार",
        spacing: "लाइन दूरी",
        width: "पढ़ने की चौड़ाई",
        comfort: "आई कम्फर्ट",
        reset: "रीसेट",
      }
    : {
        summary: "Reader settings",
        font: "Text size",
        spacing: "Line spacing",
        width: "Reading width",
        comfort: "Eye Comfort",
        reset: "Reset",
      };

  return (
    <details className="reader-controls">
      <summary>{text.summary}</summary>
      <div className="reader-controls-panel">
        <SegmentedButtons
          label={text.font}
          value={settings.font}
          values={["small", "standard", "large"]}
          labels={{ small: "A−", standard: "A", large: "A+" }}
          onChange={(font) => update({ font })}
        />

        <SegmentedButtons
          label={text.spacing}
          value={settings.spacing}
          values={["compact", "standard", "relaxed"]}
          labels={{ compact: "1×", standard: "1.5×", relaxed: "2×" }}
          onChange={(spacing) => update({ spacing })}
        />

        <SegmentedButtons
          label={text.width}
          value={settings.width}
          values={["narrow", "standard", "wide"]}
          labels={{ narrow: "S", standard: "M", wide: "L" }}
          onChange={(width) => update({ width })}
        />

        <div className="reader-setting-footer">
          <button
            className="reader-comfort-toggle"
            type="button"
            aria-pressed={settings.comfort}
            onClick={() => update({ comfort: !settings.comfort })}
          >
            <span aria-hidden="true">◑</span>
            {text.comfort}
          </button>
          <button className="reader-settings-reset" type="button" onClick={reset}>
            {text.reset}
          </button>
        </div>
      </div>
    </details>
  );
}
