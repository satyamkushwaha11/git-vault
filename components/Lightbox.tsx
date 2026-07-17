"use client";

import { useCallback, useEffect } from "react";
import TextView from "./TextView";
import { formatBytes, type Item } from "./types";
import {
  ChevronIcon,
  DownloadIcon,
  FileIcon,
  LinkIcon,
  TrashIcon,
  XIcon,
} from "./icons";

export default function Lightbox({
  items,
  index,
  onIndex,
  onClose,
  onDelete,
  onDownload,
  onCopyLink,
}: {
  items: Item[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  onDelete: (item: Item) => void;
  onDownload: (item: Item) => void;
  onCopyLink: (item: Item) => void;
}) {
  const item = items[index];

  const step = useCallback(
    (d: number) => onIndex((index + d + items.length) % items.length),
    [index, items.length, onIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    // Freeze the page behind the overlay.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, step]);

  if (!item) return null;

  // Private repos are proxied through /api/raw; public ones hotlink the CDN.
  const isPrivate = item.url?.startsWith("/api/raw") ?? false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
      onClick={onClose}
      className="animate-fade fixed inset-0 z-50 flex flex-col bg-void/85 backdrop-blur-2xl"
    >
      {/* Top bar */}
      <header
        onClick={(e) => e.stopPropagation()}
        className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{item.name}</p>
          <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
            {formatBytes(item.size)} · {index + 1} of {items.length}
          </p>
        </div>

        <Action label="Copy link" onClick={() => onCopyLink(item)}>
          <LinkIcon className="size-4" />
        </Action>
        <Action label="Download" onClick={() => onDownload(item)}>
          <DownloadIcon className="size-4" />
        </Action>
        <Action label="Delete" danger onClick={() => onDelete(item)}>
          <TrashIcon className="size-4" />
        </Action>
        <span className="mx-1 h-5 w-px bg-line" />
        <Action label="Close" onClick={onClose}>
          <XIcon className="size-4" />
        </Action>
      </header>

      {/* Stage */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 sm:p-10">
        {items.length > 1 && (
          <>
            <Arrow side="left" onClick={() => step(-1)} />
            <Arrow side="right" onClick={() => step(1)} />
          </>
        )}

        <div
          onClick={(e) => e.stopPropagation()}
          className="animate-scale-in flex max-h-full max-w-full items-center justify-center"
        >
          {item.kind === "image" && item.url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.url}
              alt={item.name}
              className="max-h-[calc(100dvh-9rem)] max-w-full rounded-lg object-contain shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]"
            />
          ) : item.kind === "video" && item.url ? (
            <video
              src={item.url}
              controls
              autoPlay
              playsInline
              className="max-h-[calc(100dvh-9rem)] max-w-full rounded-lg shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]"
            />
          ) : item.kind === "audio" && item.url ? (
            <div className="w-[min(32rem,90vw)] rounded-card p-6 glass">
              <p className="mb-4 truncate text-sm">{item.name}</p>
              <audio src={item.url} controls autoPlay className="w-full" />
            </div>
          ) : item.kind === "doc" && item.url ? (
            <iframe
              src={item.url}
              title={item.name}
              className="h-[calc(100dvh-9rem)] w-[min(60rem,92vw)] rounded-lg border border-line bg-white"
            />
          ) : item.kind === "text" && item.url ? (
            <TextView item={item} />
          ) : item.kind === "office" && item.url && !isPrivate ? (
            /* Office formats have no native browser renderer. Microsoft's
               viewer fetches the file itself, so it only works for public
               repos — a private URL would 401 on their end. */
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(item.url)}`}
              title={item.name}
              className="h-[calc(100dvh-9rem)] w-[min(64rem,92vw)] rounded-lg border border-line bg-white"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-card px-10 py-14 text-center glass">
              <FileIcon className="size-9 text-ink-faint" />
              <div>
                <p className="text-sm">
                  {item.kind === "office"
                    ? "Office files can't be previewed from a private repo."
                    : "No preview for this file type."}
                </p>
                <p className="mt-1 text-xs text-ink-faint">
                  {item.kind === "office"
                    ? "The external viewer can't reach a private URL. Download it instead."
                    : "You can still download it."}
                </p>
              </div>
              <button
                onClick={() => onDownload(item)}
                className="mt-1 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-void transition-transform hover:-translate-y-0.5"
              >
                Download
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filmstrip */}
      {items.length > 1 && (
        <footer
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 border-t border-line px-4 py-3"
        >
          <div className="flex gap-2 overflow-x-auto pb-1">
            {items.map((it, i) => (
              <button
                key={it.sha + it.path}
                onClick={() => onIndex(i)}
                aria-label={it.name}
                aria-current={i === index}
                className={`relative size-12 shrink-0 overflow-hidden rounded-md bg-raised transition-all duration-200 ${
                  i === index
                    ? "ring-2 ring-iris-soft"
                    : "opacity-45 hover:opacity-90"
                }`}
              >
                {it.kind === "image" && it.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={it.url}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="grid size-full place-items-center text-ink-faint">
                    <FileIcon className="size-4" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}

function Arrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "Previous" : "Next"}
      className={`absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full text-ink-soft transition-all duration-200 hover:scale-110 hover:text-ink glass ${
        side === "left" ? "left-3 sm:left-6" : "right-3 sm:right-6"
      }`}
    >
      <ChevronIcon
        className={`size-4 ${side === "left" ? "rotate-180" : ""}`}
      />
    </button>
  );
}

function Action({
  children,
  label,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid size-8 shrink-0 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-hover-strong ${
        danger ? "hover:bg-rose/85 hover:text-white" : "hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
