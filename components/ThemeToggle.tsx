"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./icons";

export const THEME_KEY = "git-vault:theme";

/**
 * The applied theme is set by the inline script in the layout before paint,
 * so this only has to read back what's already on <html> — mount state keeps
 * the server-rendered markup from disagreeing with it.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
    setReady(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className={`relative grid size-7 shrink-0 place-items-center rounded-md text-ink-faint transition-colors hover:bg-hover hover:text-ink ${className}`}
    >
      {/* Both icons render and cross-fade, so the swap doesn't jump. */}
      <SunIcon
        className={`absolute size-4 transition-all duration-300 ${
          ready && !dark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-50 opacity-0"
        }`}
      />
      <MoonIcon
        className={`absolute size-4 transition-all duration-300 ${
          ready && dark
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-50 opacity-0"
        }`}
      />
    </button>
  );
}
