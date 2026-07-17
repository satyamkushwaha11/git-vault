"use client";

import { useEffect, useRef, useState } from "react";
import { XIcon } from "./icons";

export default function Prompt({
  title,
  hint,
  initial = "",
  confirmLabel = "Create",
  onCancel,
  onConfirm,
}: {
  title: string;
  hint?: string;
  initial?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const input = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v || busy.current) return;
    busy.current = true;
    onConfirm(v);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
      className="animate-fade fixed inset-0 z-[60] grid place-items-center bg-void/70 p-6 backdrop-blur-md"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="animate-scale-in w-[min(24rem,100%)] overflow-hidden rounded-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] glass"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-[13px] font-medium">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="text-ink-faint transition-colors hover:text-ink"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>

        <div className="px-4 py-4">
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Name"
            className="w-full rounded-lg border border-line bg-field px-3 py-2 text-[13px] placeholder:text-ink-faint focus:border-iris/50 focus:outline-none"
          />
          {hint && (
            <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
              {hint}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-hover hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="rounded-lg bg-ink px-3.5 py-1.5 text-[12px] font-medium text-void transition-opacity disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
