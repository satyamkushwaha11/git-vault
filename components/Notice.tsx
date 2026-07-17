"use client";

import { useEffect, useState } from "react";
import { AlertIcon, XIcon } from "./icons";

/**
 * A dismissible inline warning. Dismissal is remembered per `id`, so a user
 * who's already read "private repos can't be embedded" isn't nagged forever.
 */
export default function Notice({
  id,
  tone = "warn",
  title,
  children,
}: {
  id: string;
  tone?: "warn" | "danger";
  title: string;
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(`git-vault:notice:${id}`) === "off");
    } catch {
      setHidden(false);
    }
  }, [id]);

  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(`git-vault:notice:${id}`, "off");
    } catch {}
  };

  const skin =
    tone === "danger"
      ? "border-rose/30 bg-rose/8 text-rose"
      : "border-amber/30 bg-amber/8 text-amber";

  return (
    <div
      role="status"
      className={`animate-fade mb-4 flex items-start gap-3 rounded-card border px-3.5 py-3 ${skin}`}
    >
      <AlertIcon className="mt-px size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium">{title}</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
          {children}
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-ink-faint transition-colors hover:text-ink"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}
