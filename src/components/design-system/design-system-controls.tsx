"use client";

import { useEffect, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;

  if (mode === "system") {
    delete root.dataset.theme;
    root.style.removeProperty("color-scheme");
    localStorage.removeItem("abhidea-theme");
    return;
  }

  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  localStorage.setItem("abhidea-theme", mode);
}

export function DesignSystemControls() {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [comfort, setComfort] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("abhidea-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  function chooseTheme(mode: ThemeMode) {
    setTheme(mode);
    applyTheme(mode);
  }

  return (
    <div className="surface sticky top-4 z-10 flex flex-wrap items-center gap-2 p-3" aria-label="Design system preview controls">
      <span className="mr-2 text-sm font-semibold">Theme</span>
      {(["system", "light", "dark"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          className={theme === mode ? "button button-primary" : "button button-secondary"}
          aria-pressed={theme === mode}
          onClick={() => chooseTheme(mode)}
        >
          {mode[0].toUpperCase() + mode.slice(1)}
        </button>
      ))}

      <span className="mx-2 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />

      <button
        type="button"
        className={comfort ? "button button-primary" : "button button-secondary"}
        aria-pressed={comfort}
        onClick={() => setComfort((value) => !value)}
      >
        Eye Comfort preview
      </button>

      <span className="visually-hidden" aria-live="polite">
        {comfort ? "Eye Comfort reader preview enabled" : "Eye Comfort reader preview disabled"}
      </span>

      <style jsx global>{`
        [data-design-reader-preview="true"] {
          ${comfort ? '--reader-background: #f4ecd9; --reader-surface: #f8f1e2; --reader-text: #352f28; --reader-text-secondary: #6c6257; --reader-link: #5c4b8a; --reader-border: #d9ccb6;' : ""}
        }
      `}</style>
    </div>
  );
}
