"use client";

import { useState } from "react";
import { formatBytes, type Item } from "./types";
import {
  FileIcon,
  FolderIcon,
  MusicIcon,
  PlayIcon,
  DownloadIcon,
  TrashIcon,
  PencilIcon,
} from "./icons";

/** Internal drag payload — distinct from "Files", which means an OS drag. */
export const MOVE_MIME = "application/x-vault-path";

/** True when the tile paints actual media rather than a placeholder icon. */
const hasPreview = (item: Item) =>
  (item.kind === "image" || item.kind === "video") && !!item.url;

function Thumb({ item }: { item: Item }) {
  const [loaded, setLoaded] = useState(false);
  const [broke, setBroke] = useState(false);

  if (item.kind === "image" && item.url && !broke)
    return (
      <>
        {!loaded && <div className="absolute inset-0 skeleton" />}
        {/* Plain <img>: sources are arbitrary user repos, so the Next.js
            optimizer would just add latency and cost for no benefit. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.name}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setBroke(true)}
          className={`size-full object-cover transition-all duration-500 ${
            loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          } group-hover:scale-[1.06]`}
        />
      </>
    );

  if (item.kind === "video" && item.url && !broke)
    return (
      <>
        <video
          src={`${item.url}#t=0.5`}
          preload="metadata"
          muted
          playsInline
          onError={() => setBroke(true)}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <span className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid size-11 place-items-center rounded-full bg-void/55 pl-0.5 text-ink backdrop-blur-md ring-1 ring-line-strong transition-transform duration-300 group-hover:scale-110">
            <PlayIcon className="size-4" />
          </span>
        </span>
      </>
    );

  return (
    <div className="grid size-full place-items-center bg-gradient-to-br from-hover to-transparent text-ink-faint">
      {item.kind === "audio" ? (
        <MusicIcon className="size-7" />
      ) : (
        <FileIcon className="size-7" />
      )}
    </div>
  );
}

export default function MediaGrid({
  items,
  view,
  onOpen,
  onEnterDir,
  onDelete,
  onDownload,
  onRename,
  onMove,
}: {
  items: Item[];
  view: "grid" | "list";
  onOpen: (item: Item) => void;
  onEnterDir: (path: string) => void;
  onDelete: (item: Item) => void;
  onDownload: (item: Item) => void;
  onRename: (item: Item) => void;
  onMove: (fromPath: string, toDir: string) => void;
}) {
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const activate = (item: Item) =>
    item.type === "dir" ? onEnterDir(item.path) : onOpen(item);

  /** Files are draggable; folders accept those drags as a move. */
  const dragProps = (item: Item) =>
    item.type === "file"
      ? {
          draggable: true,
          onDragStart: (e: React.DragEvent) => {
            e.dataTransfer.setData(MOVE_MIME, item.path);
            e.dataTransfer.effectAllowed = "move";
          },
        }
      : {
          onDragOver: (e: React.DragEvent) => {
            if (!e.dataTransfer.types.includes(MOVE_MIME)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDropTarget(item.path);
          },
          onDragLeave: () => setDropTarget(null),
          onDrop: (e: React.DragEvent) => {
            const from = e.dataTransfer.getData(MOVE_MIME);
            if (!from) return;
            e.preventDefault();
            e.stopPropagation();
            setDropTarget(null);
            onMove(from, item.path);
          },
        };

  const actions = (item: Item) => (
    <>
      {item.type === "file" && (
        <>
          <IconBtn label="Rename" onClick={(e) => (e.stopPropagation(), onRename(item))}>
            <PencilIcon className="size-3.5" />
          </IconBtn>
          <IconBtn
            label="Download"
            onClick={(e) => (e.stopPropagation(), onDownload(item))}
          >
            <DownloadIcon className="size-3.5" />
          </IconBtn>
        </>
      )}
      <IconBtn
        label={item.type === "dir" ? "Delete folder" : "Delete"}
        danger
        onClick={(e) => (e.stopPropagation(), onDelete(item))}
      >
        <TrashIcon className="size-3.5" />
      </IconBtn>
    </>
  );

  if (view === "list")
    return (
      <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-card border border-line">
        {items.map((item, i) => (
          <li
            key={item.sha + item.path}
            className="animate-fade"
            style={{ animationDelay: `${Math.min(i * 18, 280)}ms` }}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => activate(item)}
              onKeyDown={(e) => e.key === "Enter" && activate(item)}
              {...dragProps(item)}
              className={`group flex cursor-pointer items-center gap-3.5 px-3.5 py-2.5 transition-colors ${
                dropTarget === item.path
                  ? "bg-iris/20 ring-1 ring-inset ring-iris"
                  : "bg-raised/40 hover:bg-hover"
              }`}
            >
              <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-field">
                {item.type === "dir" ? (
                  <div className="grid size-full place-items-center text-iris-soft">
                    <FolderIcon className="size-4.5" />
                  </div>
                ) : (
                  <Thumb item={item} />
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-[13px]">
                {item.name}
              </span>
              <span className="w-20 shrink-0 text-right font-mono text-[11px] text-ink-faint">
                {item.type === "dir" ? "Folder" : formatBytes(item.size)}
              </span>
              <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                {actions(item)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    // Fixed column counts below `lg`, then auto-fill once there's room —
    // auto-fill alone strands a lone oversized tile on narrow screens.
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 sm:gap-3.5 lg:[grid-template-columns:repeat(auto-fill,minmax(11.5rem,1fr))]">
      {items.map((item, i) => (
        <div
          key={item.sha + item.path}
          role="button"
          tabIndex={0}
          onClick={() => activate(item)}
          onKeyDown={(e) => e.key === "Enter" && activate(item)}
          {...dragProps(item)}
          style={{ animationDelay: `${Math.min(i * 28, 420)}ms` }}
          className={`group animate-rise relative aspect-square cursor-pointer overflow-hidden rounded-card border bg-raised transition-all duration-300 ease-out-expo ${
            dropTarget === item.path
              ? "scale-[1.03] border-iris ring-2 ring-iris"
              : "border-line hover:-translate-y-1 hover:ring-glow"
          }`}
        >
          {item.type === "dir" ? (
            <div className="grid size-full place-items-center text-iris-soft transition-transform duration-300 group-hover:scale-105">
              <FolderIcon className="size-10" strokeWidth={1.3} />
            </div>
          ) : (
            <Thumb item={item} />
          )}

          {dropTarget === item.path && (
            <span className="absolute inset-0 grid place-items-center bg-scrim text-[11px] font-medium text-white">
              Move here
            </span>
          )}

          {/* The dark scrim only earns its place over real media. On icon
              tiles it would just be a black band across an empty card, so
              those caption in theme colours instead. */}
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-9 ${
              hasPreview(item)
                ? "bg-gradient-to-t from-black/85 via-black/45 to-transparent"
                : ""
            }`}
          >
            <p
              className={`truncate text-[12px] font-medium ${
                hasPreview(item) ? "text-white" : "text-ink"
              }`}
            >
              {item.name}
            </p>
            <p
              className={`mt-0.5 font-mono text-[10px] ${
                hasPreview(item) ? "text-white/60" : "text-ink-faint"
              }`}
            >
              {item.type === "dir" ? "Folder" : formatBytes(item.size)}
            </p>
          </div>

          <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {actions(item)}
          </div>
        </div>
      ))}
    </div>
  );
}

function IconBtn({
  children,
  label,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`pointer-events-auto grid size-7 place-items-center rounded-md bg-void/70 text-ink-soft backdrop-blur-md ring-1 ring-line-strong transition-colors ${
        danger
          ? "hover:bg-rose/85 hover:text-white"
          : "hover:bg-hover-strong hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
