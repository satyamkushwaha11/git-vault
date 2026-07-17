"use client";

import { useEffect, useRef, useState } from "react";
import { formatBytes } from "./types";
import { AlertIcon, InfoIcon, XIcon } from "./icons";

export type Rate = { limit: number; remaining: number; resetAt: number } | null;

/** GitHub emails you past 1 GB; treat that as the practical ceiling. */
const REPO_SOFT_LIMIT_KB = 1024 * 1024;

export default function Limits({
  rate,
  repoSizeKb,
  isPrivate,
}: {
  rate: Rate;
  repoSizeKb: number | null;
  isPrivate: boolean | null;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const usedPct = repoSizeKb ? (repoSizeKb / REPO_SOFT_LIMIT_KB) * 100 : 0;
  const ratePct = rate ? (rate.remaining / rate.limit) * 100 : 100;

  // Either meter running low is worth a colour change on the trigger itself.
  const alarmed = usedPct >= 80 || ratePct <= 10;

  return (
    <div ref={box} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Storage & API limits"
        aria-label="Storage and API limits"
        className={`grid size-8 place-items-center rounded-lg border transition-colors ${
          alarmed
            ? "border-amber/50 bg-amber/10 text-amber"
            : open
              ? "border-iris/50 bg-iris/10 text-ink"
              : "border-line bg-raised/60 text-ink-soft hover:text-ink"
        }`}
      >
        {alarmed ? (
          <AlertIcon className="size-4" />
        ) : (
          <InfoIcon className="size-4" />
        )}
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 top-[calc(100%+6px)] z-30 w-80 overflow-hidden rounded-card shadow-[0_24px_60px_-15px_rgba(0,0,0,0.4)] glass">
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <h3 className="text-[12px] font-medium">Limits</h3>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-ink-faint transition-colors hover:text-ink"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>

          <div className="space-y-3.5 px-3.5 py-3.5">
            <Meter
              label="Repo size"
              value={
                repoSizeKb === null
                  ? "—"
                  : `${formatBytes(repoSizeKb * 1024)} of 1 GB`
              }
              pct={usedPct}
              warn={usedPct >= 80}
              hint="GitHub warns past 1 GB and hard-caps at 5 GB."
            />

            <Meter
              label="API requests"
              value={
                rate ? `${rate.remaining.toLocaleString()} of ${rate.limit.toLocaleString()} left` : "—"
              }
              pct={ratePct}
              warn={ratePct <= 10}
              hint={
                rate
                  ? `Resets ${new Date(rate.resetAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}.${isPrivate ? " Private repos spend one per file view." : ""}`
                  : "Per hour, shared across your token."
              }
            />

            <ul className="space-y-1.5 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-faint">
              <Fact>
                <b className="text-ink-soft">95 MB</b> max per file — GitHub&apos;s
                own ceiling. Bigger images are compressed automatically; video
                and archives are rejected.
              </Fact>
              <Fact>
                {isPrivate ? (
                  <>
                    <b className="text-amber">Private repo:</b> links only
                    resolve for signed-in users, so they can&apos;t be embedded
                    in a public site.
                  </>
                ) : (
                  <>
                    <b className="text-lime">Public repo:</b> every file has a
                    permanent CDN link, free to embed anywhere.
                  </>
                )}
              </Fact>
              <Fact>
                Uploads go straight from your browser to GitHub, so host body
                limits (like Vercel&apos;s 4.5 MB) don&apos;t apply.
              </Fact>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-1.5">
      <span className="text-ink-faint/50">·</span>
      <span>{children}</span>
    </li>
  );
}

/** `pct` is always how full the bar should read, never how empty. */
function Meter({
  label,
  value,
  pct,
  warn,
  hint,
}: {
  label: string;
  value: string;
  pct: number;
  warn: boolean;
  hint: string;
}) {
  const width = Math.min(100, Math.max(2, pct));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-ink-soft">{label}</span>
        <span
          className={`font-mono text-[10px] ${warn ? "text-amber" : "text-ink-faint"}`}
        >
          {value}
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-hover-strong">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            warn ? "bg-amber" : "bg-gradient-to-r from-iris to-aqua"
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] leading-snug text-ink-faint">{hint}</p>
    </div>
  );
}
