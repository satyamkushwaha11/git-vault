"use client";

import { formatBytes } from "./types";
import { AlertIcon, CheckIcon, CompressIcon, XIcon } from "./icons";

export type Job = {
  id: string;
  name: string;
  size: number;
  progress: number;
  state: "compressing" | "uploading" | "done" | "error";
  error?: string;
  /** e.g. "Compressed 62 MB → 7.4 MB" */
  note?: string;
};

export default function Uploads({
  jobs,
  onClear,
}: {
  jobs: Job[];
  onClear: () => void;
}) {
  if (!jobs.length) return null;

  const active = jobs.filter(
    (j) => j.state === "uploading" || j.state === "compressing",
  ).length;

  return (
    <div className="animate-rise absolute bottom-4 left-4 right-4 z-30 sm:right-auto sm:w-[19rem] overflow-hidden rounded-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] glass">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <p className="text-[12px] font-medium">
          {active
            ? `Uploading ${active} file${active > 1 ? "s" : ""}`
            : "Uploads"}
        </p>
        <button
          onClick={onClear}
          aria-label="Clear uploads"
          className="text-ink-faint transition-colors hover:text-ink"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>

      <ul className="max-h-56 overflow-y-auto">
        {jobs.map((j) => (
          <li key={j.id} className="border-b border-line/60 px-3.5 py-2.5 last:border-0">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[12px]">
                {j.name}
              </span>
              {j.state === "done" ? (
                <CheckIcon className="size-3.5 shrink-0 text-lime" />
              ) : j.state === "error" ? (
                <AlertIcon className="size-3.5 shrink-0 text-rose" />
              ) : j.state === "compressing" ? (
                <CompressIcon className="size-3.5 shrink-0 animate-pulse text-aqua" />
              ) : (
                <span className="shrink-0 font-mono text-[10px] text-ink-faint">
                  {Math.round(j.progress * 100)}%
                </span>
              )}
            </div>

            {j.note && j.state !== "error" && (
              <p className="mt-1 text-[10px] leading-snug text-aqua/90">
                {j.note}
              </p>
            )}

            {j.state === "error" ? (
              <p className="mt-1 text-[11px] leading-snug text-rose/90">
                {j.error}
              </p>
            ) : j.state === "compressing" ? (
              <p className="mt-1.5 text-[11px] text-ink-faint">
                Compressing to fit under 95 MB…
              </p>
            ) : (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-hover-strong">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ease-out ${
                      j.state === "done"
                        ? "bg-lime"
                        : "bg-gradient-to-r from-iris to-aqua"
                    }`}
                    style={{ width: `${Math.max(j.progress * 100, 4)}%` }}
                  />
                </div>
                <span className="shrink-0 font-mono text-[10px] text-ink-faint">
                  {formatBytes(j.size)}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
