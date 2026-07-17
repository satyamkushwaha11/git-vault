"use client";

import { useEffect, useRef, useState } from "react";
import { BranchIcon, CheckIcon, LockIcon, SearchIcon } from "./icons";

export type Branch = { name: string; protected: boolean };

export default function BranchPicker({
  branches,
  current,
  defaultBranch,
  loading,
  onPick,
}: {
  branches: Branch[];
  current: string | null;
  defaultBranch: string | null;
  loading: boolean;
  onPick: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
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

  const shown = branches.filter((b) =>
    b.name.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div ref={box} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Switch branch"
        className={`flex max-w-[11rem] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors ${
          open
            ? "border-iris/50 bg-iris/10 text-ink"
            : "border-line bg-raised/60 text-ink-soft hover:text-ink"
        }`}
      >
        <BranchIcon className="size-3.5 shrink-0 text-iris-soft" />
        <span className="truncate font-mono">
          {loading ? "…" : (current ?? "—")}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="animate-scale-in absolute right-0 top-[calc(100%+6px)] z-30 w-64 overflow-hidden rounded-card shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] glass"
        >
          <div className="border-b border-line p-2">
            <div className="group relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Find a branch"
                className="w-full rounded-md border border-line bg-field py-1.5 pl-8 pr-2 text-[12px] placeholder:text-ink-faint focus:border-iris/50 focus:outline-none"
              />
            </div>
          </div>

          <ul className="max-h-64 overflow-y-auto p-1">
            {shown.length === 0 ? (
              <li className="px-3 py-5 text-center text-[12px] text-ink-faint">
                No branches match.
              </li>
            ) : (
              shown.map((b) => (
                <li key={b.name}>
                  <button
                    role="option"
                    aria-selected={b.name === current}
                    onClick={() => {
                      onPick(b.name);
                      setOpen(false);
                      setQ("");
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-hover"
                  >
                    <span className="w-3.5 shrink-0">
                      {b.name === current && (
                        <CheckIcon className="size-3.5 text-iris-soft" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[12px]">
                      {b.name}
                    </span>
                    {b.protected && (
                      <LockIcon
                        className="size-3 shrink-0 text-amber"
                        aria-label="Protected"
                      />
                    )}
                    {b.name === defaultBranch && (
                      <span className="shrink-0 rounded bg-hover-strong px-1.5 py-px text-[9px] uppercase tracking-wide text-ink-faint">
                        default
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
