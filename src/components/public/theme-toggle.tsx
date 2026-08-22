"use client";

import { useSyncExternalStore } from "react";

type ThemeMode = "system" | "light" | "dark";
type Listener = () => void;

const listeners = new Set<Listener>();

function getTheme(): ThemeMode {
  const saved = localStorage.getItem("abhidea-theme");
  return saved === "light" || saved === "dark" ? saved : "system";
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === "abhidea-theme") listener();
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

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") {
    delete root.dataset.theme;
    root.style.removeProperty("color-scheme");
    localStorage.removeItem("abhidea-theme");
  } else {
    root.dataset.theme = mode;
    root.style.colorScheme = mode;
    localStorage.setItem("abhidea-theme", mode);
  }
  emit();
}

const nextTheme: Record<ThemeMode, ThemeMode> = {
  system: "light",
  light: "dark",
  dark: "system",
};

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "light") {
    return <span aria-hidden="true">☀</span>;
  }
  if (mode === "dark") {
    return <span aria-hidden="true">☾</span>;
  }
  return <span aria-hidden="true">◐</span>;
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "system");
  const next = nextTheme[theme];

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={`Theme is ${theme}. Switch to ${next}.`}
      title={`Theme: ${theme}`}
    >
      <ThemeIcon mode={theme} />
      <span className="visually-hidden">Theme: {theme}</span>
    </button>
  );
}
