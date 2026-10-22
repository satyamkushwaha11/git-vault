"use client";

import { useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import type { RepoSummary } from "./types";
import ThemeToggle from "./ThemeToggle";
import {
  GlobeIcon,
  LockIcon,
  PlusIcon,
  SearchIcon,
  SparkIcon,
  XIcon,
} from "./icons";

type Scope = "all" | "public" | "private";

export default function Sidebar({
  repos,
  loading,
  selected,
  onSelect,
  onNewRepo,
  user,
  open,
  onClose,
}: {
  repos: RepoSummary[];
  loading: boolean;
  selected: string | null;
  onSelect: (full: string) => void;
  onNewRepo: () => void;
  user: { name?: string | null; image?: string | null };
  /** Drawer state — only meaningful below `lg`, where the rail goes off-canvas. */
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<Scope>("all");

  const counts = useMemo(
    () => ({
      all: repos.length,
      public: repos.filter((r) => !r.private).length,
      private: repos.filter((r) => r.private).length,
    }),
    [repos],
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return repos.filter((r) => {
      if (scope === "public" && r.private) return false;
      if (scope === "private" && !r.private) return false;
      return !needle || r.full_name.toLowerCase().includes(needle);
    });
  }, [repos, q, scope]);

  return (
    <>
      {/* Scrim only exists while the drawer is open on small screens. */}
      {open && (
        <div
          onClick={onClose}
          className="animate-fade fixed inset-0 z-40 bg-void/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[272px] max-w-[85vw] shrink-0 flex-col border-r border-line bg-base backdrop-blur-xl transition-transform duration-300 ease-out-expo lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:bg-base/60 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-iris to-aqua text-void">
            <SparkIcon className="size-3.5" />
          </div>
          <span className="flex-1 text-[15px] font-semibold tracking-tight">
            git-vault
          </span>
          <button
            onClick={onNewRepo}
            title="New bucket"
            aria-label="New bucket"
            className="grid size-7 place-items-center rounded-md border border-line text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
          >
            <PlusIcon className="size-3.5" />
          </button>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-7 place-items-center rounded-md text-ink-faint transition-colors hover:text-ink lg:hidden"
          >
            <XIcon className="size-4" />
          </button>
        </div>

      <div className="px-4 pb-2.5">
        <div className="group relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint transition-colors group-focus-within:text-iris-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search repositories"
            className="w-full rounded-lg border border-line bg-field py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-faint focus:border-iris/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Visibility filter — also doubles as the legend for the row icons. */}
      <div className="flex gap-1 px-4 pb-3">
        {(["all", "public", "private"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            aria-pressed={scope === s}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md border py-1.5 text-[11px] font-medium capitalize transition-colors ${
              scope === s
                ? s === "private"
                  ? "border-amber/40 bg-amber/12 text-amber"
                  : s === "public"
                    ? "border-lime/40 bg-lime/12 text-lime"
                    : "border-line-strong bg-hover text-ink"
                : "border-line text-ink-faint hover:text-ink-soft"
            }`}
          >
            {s === "private" && <LockIcon className="size-2.5" />}
            {s === "public" && <GlobeIcon className="size-2.5" />}
            {s}
            <span className="opacity-50">{counts[s]}</span>
          </button>
        ))}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
        {loading ? (
          <div className="flex flex-col gap-1.5 px-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg skeleton" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className="px-2.5 py-6 text-center text-xs text-ink-faint">
            {repos.length ? "No matches." : "No repositories found."}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {shown.map((r) => {
              const active = r.full_name === selected;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => onSelect(r.full_name)}
                    title={`${r.full_name} · ${r.private ? "Private" : "Public"}`}
                    className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 ${
                      active
                        ? "bg-iris/14 text-ink"
                        : "text-ink-soft hover:bg-hover hover:text-ink"
                    }`}
                  >
                    <span
                      title={r.private ? "Private repo" : "Public repo"}
                      className={r.private ? "text-amber" : "text-lime"}
                    >
                      {r.private ? (
                        <LockIcon className="size-3.5" />
                      ) : (
                        <GlobeIcon className="size-3.5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px]">
                      {r.name}
                    </span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-px text-[9px] font-medium uppercase tracking-wide transition-opacity ${
                        r.private
                          ? "bg-amber/12 text-amber"
                          : "bg-lime/12 text-lime"
                      } ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    >
                      {r.private ? "Private" : "Public"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-line px-4 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.image ?? ""}
          alt=""
          className="size-7 rounded-full ring-1 ring-line"
        />
        <span className="min-w-0 flex-1 truncate text-[13px] text-ink-soft">
          {user.name}
        </span>
        <ThemeToggle />
        <button
          onClick={() => signOut({ redirectTo: "/" })}
          className="rounded-md px-2 py-1 text-[11px] text-ink-faint transition-colors hover:bg-hover hover:text-ink"
        >
          Sign out
        </button>
        </div>
      </aside>
    </>
  );
}
