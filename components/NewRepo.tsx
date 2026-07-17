"use client";

import { useEffect, useRef, useState } from "react";
import { GlobeIcon, LockIcon, XIcon } from "./icons";

export default function NewRepo({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (name: string, isPrivate: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = name.trim();
    if (!v || busy) return;
    setBusy(true);
    onCreate(v, isPrivate);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New bucket"
      onClick={onCancel}
      className="animate-fade fixed inset-0 z-[60] grid place-items-center bg-void/70 p-6 backdrop-blur-md"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="animate-scale-in w-[min(26rem,100%)] overflow-hidden rounded-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] glass"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-[13px] font-medium">New bucket</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="text-ink-faint transition-colors hover:text-ink"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-ink-soft">
              Repository name
            </label>
            <input
              ref={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-media"
              className="w-full rounded-lg border border-line bg-field px-3 py-2 font-mono text-[13px] placeholder:text-ink-faint focus:border-iris/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-ink-soft">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Choice
                active={isPrivate}
                onClick={() => setIsPrivate(true)}
                icon={<LockIcon className="size-3.5" />}
                tone="amber"
                title="Private"
                body="Only you. Files stream through this app — no public links."
              />
              <Choice
                active={!isPrivate}
                onClick={() => setIsPrivate(false)}
                icon={<GlobeIcon className="size-3.5" />}
                tone="lime"
                title="Public"
                body="Anyone with the URL. Gives you permanent CDN links for your site."
              />
            </div>
          </div>
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
            disabled={!name.trim() || busy}
            className="rounded-lg bg-ink px-3.5 py-1.5 text-[12px] font-medium text-void transition-opacity disabled:opacity-40"
          >
            {busy ? "Creating…" : "Create bucket"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Choice({
  active,
  onClick,
  icon,
  title,
  body,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "amber" | "lime";
}) {
  const on =
    tone === "amber"
      ? "border-amber/50 bg-amber/10"
      : "border-lime/50 bg-lime/10";
  const ink = tone === "amber" ? "text-amber" : "text-lime";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border p-2.5 text-left transition-colors ${
        active ? on : "border-line hover:border-line-strong"
      }`}
    >
      <span
        className={`flex items-center gap-1.5 text-[12px] font-medium ${
          active ? ink : "text-ink-soft"
        }`}
      >
        {icon}
        {title}
      </span>
      <span className="mt-1 block text-[10.5px] leading-snug text-ink-faint">
        {body}
      </span>
    </button>
  );
}
