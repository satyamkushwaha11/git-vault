"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import manifest from "./demo-manifest.json";
import { kindOf, formatBytes } from "@/lib/github";
import {
  CheckIcon,
  ChevronIcon,
  FileIcon,
  FolderIcon,
  GlobeIcon,
  LinkIcon,
  UploadIcon,
  XIcon,
} from "../icons";

/**
 * A real, read-only copy of the app's gallery, running on the sample bucket
 * that lives in this repository under public/demo. Links it hands out are the
 * genuine raw.githubusercontent.com URLs for those files. Uploads are
 * simulated locally so visitors can feel the flow without signing in.
 */

const RAW = "https://raw.githubusercontent.com/satyamkushwaha11/git-vault/master/public/demo/";

type Entry = { path: string; name: string; type: "dir" | "file"; size: number; src?: string };
type Job = { id: number; name: string; progress: number; done: boolean; src?: string };

const ENTRIES = manifest as Entry[];

export default function DemoVault() {
  const [path, setPath] = useState("");
  const [open, setOpen] = useState<Entry | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [extra, setExtra] = useState<Entry[]>([]);
  const [committed, setCommitted] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    const all = [...ENTRIES, ...extra];
    const here = all.filter((e) => {
      const parent = e.path.includes("/") ? e.path.slice(0, e.path.lastIndexOf("/")) : "";
      return parent === path;
    });
    return here.sort((a, b) =>
      a.type !== b.type ? (a.type === "dir" ? -1 : 1) : a.name.localeCompare(b.name),
    );
  }, [path, extra]);

  const images = useMemo(
    () => items.filter((i) => i.type === "file" && kindOf(i.name) === "image"),
    [items],
  );

  const crumbs = path ? path.split("/") : [];
  const urlFor = (e: Entry) => (e.path.startsWith("local:") ? "" : RAW + e.path);
  const srcFor = (e: Entry) => e.src ?? (e.path.startsWith("local:") ? "" : `/demo/${e.path}`);

  const copy = useCallback(async (e: Entry) => {
    const url = urlFor(e);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
    setCopied(e.path);
    setTimeout(() => setCopied(null), 1600);
  }, []);

  /* Simulated upload: progress, then a "commit", then the tile appears. */
  const fakeUpload = useCallback(
    (files: File[]) => {
      const batch = files.slice(0, 4).map((f, i) => ({
        id: Date.now() + i,
        name: f.name.replace(/[^\w.\- ]+/g, "_"),
        progress: 0,
        done: false,
        src: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      }));
      if (!batch.length) return;
      setJobs((j) => [...j, ...batch]);
      let tick = 0;
      const timer = setInterval(() => {
        tick++;
        setJobs((j) =>
          j.map((x) =>
            batch.some((b) => b.id === x.id)
              ? { ...x, progress: Math.min(1, tick / 12), done: tick >= 12 }
              : x,
          ),
        );
        if (tick >= 12) {
          clearInterval(timer);
          const sha = Math.random().toString(16).slice(2, 9);
          setCommitted(sha);
          setExtra((x) => [
            ...x,
            ...batch.map((b) => ({
              path: `local:${b.name}`,
              name: b.name,
              type: "file" as const,
              size: files.find((f) => f.name.replace(/[^\w.\- ]+/g, "_") === b.name)?.size ?? 0,
              src: b.src,
            })),
          ]);
          setTimeout(() => setJobs((j) => j.filter((x) => !batch.some((b) => b.id === x.id))), 1400);
          setTimeout(() => setCommitted(null), 3200);
        }
      }, 90);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const i = images.findIndex((x) => x.path === open.path);
        if (i < 0) return;
        const d = e.key === "ArrowRight" ? 1 : -1;
        setOpen(images[(i + d + images.length) % images.length]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images]);

  return (
    <div
      id="demo"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        fakeUpload(Array.from(e.dataTransfer.files));
      }}
      className="ring-glow relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-base text-left"
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-rose/70" />
        <span className="size-2.5 rounded-full bg-amber/70" />
        <span className="size-2.5 rounded-full bg-lime/70" />
        <span className="ml-3 hidden truncate rounded-md bg-field px-2.5 py-1 font-mono text-[11px] text-ink-faint sm:block">
          git-vault.satyamkushwaha.online/vault/satyamkushwaha11/git-vault{path ? `/${path}` : ""}
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-iris/12 px-2.5 py-1 text-[10px] font-medium text-iris-soft">
          <span className="size-1.5 rounded-full bg-iris-soft" />
          Live demo · read-only
        </span>
      </div>

      <div className="flex min-h-[26rem] sm:min-h-[30rem]">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-void/40 p-3 md:flex">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            Buckets
          </p>
          {[
            { name: "git-vault / demo", on: true, pub: true },
            { name: "portfolio-assets", on: false, pub: true },
            { name: "client-work", on: false, pub: false },
          ].map((r) => (
            <div
              key={r.name}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] ${
                r.on ? "bg-hover-strong text-ink" : "text-ink-soft"
              }`}
            >
              {r.pub ? <GlobeIcon className="size-3.5 text-lime" /> : <span className="size-3.5 rounded-sm bg-amber/60" />}
              <span className="truncate">{r.name}</span>
            </div>
          ))}
          <div className="mt-auto rounded-lg border border-dashed border-line p-3 text-[11px] leading-relaxed text-ink-faint">
            Sign in and any repo you own shows up here.
          </div>
        </aside>

        {/* Main */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5 sm:px-4">
            <nav className="flex min-w-0 flex-1 items-center gap-1 text-[13px]">
              <button onClick={() => setPath("")} className="truncate rounded px-1 py-0.5 font-medium hover:text-iris-soft">
                demo
              </button>
              <span className="ml-0.5 inline-flex items-center gap-1 rounded-full bg-lime/12 px-2 py-0.5 text-[10px] font-medium text-lime">
                <GlobeIcon className="size-2.5" /> Public
              </span>
              {crumbs.map((c, i) => (
                <span key={i} className="flex min-w-0 items-center">
                  <ChevronIcon className="size-3.5 shrink-0 text-ink-faint" />
                  <button
                    onClick={() => setPath(crumbs.slice(0, i + 1).join("/"))}
                    className={`truncate rounded px-1 py-0.5 ${i === crumbs.length - 1 ? "text-ink" : "text-ink-soft hover:text-ink"}`}
                  >
                    {c}
                  </button>
                </span>
              ))}
            </nav>
            <button
              onClick={() => fileInput.current?.click()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12px] font-medium text-void transition-all hover:-translate-y-0.5"
            >
              <UploadIcon className="size-3.5" />
              Upload
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                fakeUpload(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </div>

          <div className="grid flex-1 grid-cols-2 content-start gap-2.5 overflow-y-auto p-3 sm:grid-cols-3 sm:gap-3 sm:p-4 lg:grid-cols-4">
            {items.map((e) => {
              const kind = e.type === "dir" ? "dir" : kindOf(e.name);
              const isImg = kind === "image";
              const src = isImg ? srcFor(e) : "";
              return (
                <div
                  key={e.path}
                  className="group relative aspect-square overflow-hidden rounded-card border border-line bg-raised transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong"
                >
                  <button
                    onClick={() => (e.type === "dir" ? setPath(e.path) : isImg && setOpen(e))}
                    className="absolute inset-0 grid place-items-center"
                    aria-label={e.name}
                  >
                    {e.type === "dir" ? (
                      <FolderIcon className="size-10 text-iris-soft" />
                    ) : isImg && src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <FileIcon className="size-9 text-ink-faint" />
                    )}
                  </button>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim to-transparent px-2.5 pb-2 pt-8">
                    <p className="truncate text-[11.5px] font-medium text-white">{e.name}</p>
                    <p className="text-[10px] text-white/60">
                      {e.type === "dir" ? "folder" : formatBytes(e.size)}
                    </p>
                  </div>

                  {e.type === "file" && urlFor(e) && (
                    <button
                      onClick={() => copy(e)}
                      title="Copy permanent link"
                      className={`absolute right-2 top-2 grid size-7 place-items-center rounded-md text-white transition-all glass ${
                        copied === e.path ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {copied === e.path ? (
                        <CheckIcon className="size-3.5 text-lime" />
                      ) : (
                        <LinkIcon className="size-3.5 text-ink" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upload jobs */}
          {jobs.length > 0 && (
            <div className="absolute bottom-3 right-3 w-64 space-y-1.5 rounded-xl p-2.5 glass">
              {jobs.map((j) => (
                <div key={j.id} className="text-[11px]">
                  <div className="flex justify-between text-ink-soft">
                    <span className="truncate">{j.name}</span>
                    <span>{j.done ? "committed" : `${Math.round(j.progress * 100)}%`}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-hover-strong">
                    <div className="h-full bg-iris transition-[width]" style={{ width: `${j.progress * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {committed && (
            <div className="animate-rise absolute left-1/2 top-14 -translate-x-1/2 rounded-full px-3.5 py-1.5 text-[11.5px] glass">
              <span className="text-lime">✓</span> Commit <span className="font-mono text-ink">{committed}</span> on main
              <span className="text-ink-faint"> · preview only, nothing was pushed</span>
            </div>
          )}

          {dragging && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-void/70 backdrop-blur-sm">
              <div className="rounded-2xl border-2 border-dashed border-iris/60 px-10 py-8 text-center">
                <UploadIcon className="mx-auto size-6 text-iris-soft" />
                <p className="mt-2 text-sm font-medium">Drop to try an upload</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          onClick={() => setOpen(null)}
          className="animate-fade absolute inset-0 z-10 grid place-items-center bg-scrim p-6 backdrop-blur-md"
        >
          <div onClick={(e) => e.stopPropagation()} className="animate-scale-in relative max-h-full max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={srcFor(open)} alt={open.name} className="max-h-[60vh] rounded-xl object-contain shadow-2xl" />
            <div className="mt-3 flex items-center justify-between gap-3 text-[12px] text-white/80">
              <span className="truncate font-mono">{open.name}</span>
              <div className="flex gap-2">
                {urlFor(open) && (
                  <button onClick={() => copy(open)} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 glass text-ink">
                    {copied === open.path ? <CheckIcon className="size-3.5 text-lime" /> : <LinkIcon className="size-3.5" />}
                    {copied === open.path ? "Copied" : "Copy link"}
                  </button>
                )}
                <button onClick={() => setOpen(null)} className="grid size-7 place-items-center rounded-md glass text-ink" aria-label="Close">
                  <XIcon className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
