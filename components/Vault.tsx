"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { vaultUrl } from "@/lib/routes";
import Sidebar from "./Sidebar";
import MediaGrid, { MOVE_MIME } from "./MediaGrid";
import Lightbox from "./Lightbox";
import Prompt from "./Prompt";
import NewRepo from "./NewRepo";
import Notice from "./Notice";
import Limits, { type Rate } from "./Limits";
import BranchPicker, { type Branch } from "./BranchPicker";
import Uploads, { type Job } from "./Uploads";
import { useToast } from "./Toast";
import { formatBytes, type Item, type Listing, type RepoSummary } from "./types";
import { shrinkToFit, MAX_BYTES } from "@/lib/compress";
import { uploadDirect } from "@/lib/upload-direct";
import {
  ChevronIcon,
  GridIcon,
  ListIcon,
  LockIcon,
  GlobeIcon,
  MenuIcon,
  SearchIcon,
  UploadIcon,
  FolderPlusIcon,
  SparkIcon,
} from "./icons";

const LAST_REPO = "git-vault:last-repo";

type Dialog =
  | { kind: "folder" }
  | { kind: "rename"; item: Item }
  | { kind: "repo" }
  | null;

export default function Vault({
  user,
  token,
  canPrivate,
  repo,
  path,
  branchParam,
}: {
  user: { name?: string | null; image?: string | null };
  /** Uploads go browser→GitHub directly, so the token has to reach the client. */
  token?: string;
  /** False when the session was granted `public_repo` only. */
  canPrivate: boolean;
  /** Where we are, straight from the URL — see `vaultUrl` in lib/routes.ts. */
  repo: string | null;
  path: string;
  branchParam: string | null;
}) {
  const toast = useToast();
  const router = useRouter();

  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [lastRepo, setLastRepo] = useState<string | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);
  const [branchLoading, setBranchLoading] = useState(false);

  // The URL only names a branch when it isn't the default, and a stale link
  // may name one that no longer exists — fall back rather than 404.
  const branch = useMemo(() => {
    if (!defaultBranch) return null;
    if (branchParam && branches.some((b) => b.name === branchParam))
      return branchParam;
    return defaultBranch;
  }, [branches, defaultBranch, branchParam]);

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragging, setDragging] = useState(false);
  const [rate, setRate] = useState<Rate>(null);
  const [navOpen, setNavOpen] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  /* ── Repos ──────────────────────────────────────────────── */

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/repos");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRepos(data);
        const saved = localStorage.getItem(LAST_REPO);
        if (saved && data.some((r: RepoSummary) => r.full_name === saved))
          setLastRepo(saved);
      } catch (e) {
        toast("err", `Couldn't load repositories: ${(e as Error).message}`);
      } finally {
        setReposLoading(false);
      }
    })();
  }, [toast]);

  /* ── Rate limit (refreshed after each listing) ──────────── */

  const refreshRate = useCallback(async () => {
    try {
      const res = await fetch("/api/limits");
      if (!res.ok) return;
      const data = await res.json();
      setRate(data);
      if (data.remaining < 200)
        toast(
          "err",
          `Only ${data.remaining} GitHub API requests left this hour. Resets at ${new Date(
            data.resetAt,
          ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
        );
    } catch {
      // A failed limits check should never break the page.
    }
  }, [toast]);

  useEffect(() => {
    refreshRate();
  }, [refreshRate]);

  /* ── Branches (refetched whenever the repo changes) ─────── */

  useEffect(() => {
    if (!repo) return;
    let alive = true;
    setBranchLoading(true);
    setBranches([]);
    setDefaultBranch(null);

    (async () => {
      try {
        const res = await fetch(`/api/branches?repo=${encodeURIComponent(repo)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (!alive) return;
        setBranches(data.branches);
        setDefaultBranch(data.default);
      } catch (e) {
        if (alive) toast("err", `Couldn't load branches: ${(e as Error).message}`);
      } finally {
        if (alive) setBranchLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [repo, toast]);

  /* ── Listing ────────────────────────────────────────────── */

  const load = useCallback(async () => {
    if (!repo || !branch) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/media?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(
          path,
        )}&branch=${encodeURIComponent(branch)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setListing(data);
    } catch (e) {
      setErr((e as Error).message);
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [repo, path, branch]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Navigation (all of it goes through the URL) ────────── */

  // Switching repo or folder re-renders this same component with new props,
  // so uploads in flight and the repo list survive the navigation.
  const selectRepo = useCallback(
    (full: string) => {
      setNavOpen(false);
      router.push(vaultUrl(full));
    },
    [router],
  );

  const goPath = useCallback(
    (p: string) => router.push(vaultUrl(repo, p, branchParam)),
    [router, repo, branchParam],
  );

  // A folder may not exist on another branch, so a branch switch starts at root.
  const selectBranch = useCallback(
    (name: string) => router.push(vaultUrl(repo, "", name, defaultBranch)),
    [router, repo, defaultBranch],
  );

  useEffect(() => {
    if (!repo) return;
    localStorage.setItem(LAST_REPO, repo);
    setLastRepo(repo);
  }, [repo]);

  // Old results shouldn't linger under a new location's breadcrumbs.
  useEffect(() => {
    setFilter("");
    setListing(null);
    setErr(null);
  }, [repo, path]);

  /* ── Derived ────────────────────────────────────────────── */

  const items = useMemo(() => {
    const all = listing?.items ?? [];
    const needle = filter.trim().toLowerCase();
    return needle
      ? all.filter((i) => i.name.toLowerCase().includes(needle))
      : all;
  }, [listing, filter]);

  // The lightbox only pages through files, so folders never become blank slides.
  const viewable = useMemo(() => items.filter((i) => i.type === "file"), [items]);

  const crumbs = path ? path.split("/") : [];

  /* ── Upload ─────────────────────────────────────────────── */

  const upload = useCallback(
    async (files: File[]) => {
      if (!repo || !branch || !files.length) return;
      if (!token) {
        toast("err", "No GitHub token in this session — sign out and back in.");
        return;
      }

      const patch = (id: string, next: Partial<Job>) =>
        setJobs((j) => j.map((x) => (x.id === id ? { ...x, ...next } : x)));

      const queued: Job[] = files.map((f, i) => ({
        id: `${Date.now()}-${i}-${f.name}`,
        name: f.name,
        size: f.size,
        progress: 0,
        state: f.size > MAX_BYTES ? "compressing" : "uploading",
      }));
      setJobs((j) => [...j, ...queued]);

      let done = 0;
      const finish = () => {
        if (++done === files.length) load();
      };

      await Promise.all(
        files.map(async (original, i) => {
          const job = queued[i];

          // Oversized images get re-encoded down to fit; anything else that's
          // too big fails here with an explanation rather than at the API.
          let file = original;
          if (original.size > MAX_BYTES) {
            try {
              const r = await shrinkToFit(original);
              file = r.file;
              patch(job.id, {
                state: "uploading",
                name: r.file.name,
                size: r.file.size,
                note: `Compressed ${formatBytes(r.from)} → ${formatBytes(r.to)}`,
              });
            } catch (e) {
              const msg = (e as Error).message;
              patch(job.id, { state: "error", error: msg });
              toast("err", msg);
              finish();
              return;
            }
          }

          const safe = file.name.replace(/[^\w.\- ]+/g, "_");
          const target = path ? `${path}/${safe}` : safe;

          try {
            await uploadDirect({
              token,
              repo,
              branch,
              path: target,
              file,
              onProgress: (p) => patch(job.id, { progress: p }),
            });
            patch(job.id, { progress: 1, state: "done" });
            setTimeout(
              () => setJobs((j) => j.filter((x) => x.id !== job.id)),
              2200,
            );
          } catch (e) {
            const msg = (e as Error).message;
            patch(job.id, { state: "error", error: msg });
            toast("err", msg);
          }
          finish();
        }),
      );
    },
    [repo, branch, path, load, toast, token],
  );

  /* ── Mutations ──────────────────────────────────────────── */

  const remove = useCallback(
    async (item: Item) => {
      if (!repo || !branch) return;
      const isDir = item.type === "dir";
      const ok = confirm(
        isDir
          ? `Delete the folder "${item.name}" and everything inside it?\n\nThis commits to ${repo}@${branch}.`
          : `Delete "${item.name}"?\n\nThis commits to ${repo}@${branch}.`,
      );
      if (!ok) return;

      try {
        const res = await fetch("/api/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repo,
            branch,
            path: item.path,
            sha: item.sha,
            type: item.type,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast(
          "ok",
          isDir
            ? `Deleted ${item.name}/ (${data.removed} file${data.removed > 1 ? "s" : ""})`
            : `Deleted ${item.name}`,
        );
        setLightbox(null);
        load();
      } catch (e) {
        toast("err", `Couldn't delete: ${(e as Error).message}`);
      }
    },
    [repo, branch, load, toast],
  );

  const move = useCallback(
    async (from: string, toDir: string, rename?: string) => {
      if (!repo || !branch) return;
      try {
        const res = await fetch("/api/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo, branch, from, toDir, rename }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast("ok", rename ? `Renamed to ${rename}` : `Moved to ${toDir}/`);
        setLightbox(null);
        load();
      } catch (e) {
        toast("err", `Couldn't move: ${(e as Error).message}`);
      }
    },
    [repo, branch, load, toast],
  );

  const createFolder = useCallback(
    async (name: string) => {
      if (!repo || !branch) return;
      setDialog(null);
      try {
        const res = await fetch("/api/folder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo, branch, path, name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast("ok", `Created ${data.path}/`);
        load();
      } catch (e) {
        toast("err", `Couldn't create folder: ${(e as Error).message}`);
      }
    },
    [repo, branch, path, load, toast],
  );

  const createRepo = useCallback(
    async (name: string, isPrivate: boolean) => {
      try {
        const res = await fetch("/api/repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, private: isPrivate }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setDialog(null);
        setRepos((r) => [data.repo, ...r]);
        selectRepo(data.repo.full_name);
        toast("ok", `Created ${data.repo.full_name}`);
      } catch (e) {
        setDialog(null);
        toast("err", `Couldn't create repo: ${(e as Error).message}`);
      }
    },
    [toast, selectRepo],
  );

  const download = useCallback((item: Item) => {
    if (!item.url) return;
    const href = item.url.startsWith("/api/raw")
      ? `${item.url}&download=1`
      : item.url;
    const a = document.createElement("a");
    a.href = href;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  const copyLink = useCallback(
    async (item: Item) => {
      if (!item.url) return;
      const isPrivate = item.url.startsWith("/api/raw");
      const url = isPrivate ? location.origin + item.url : item.url;
      try {
        await navigator.clipboard.writeText(url);
        toast(
          "ok",
          isPrivate
            ? "Link copied — only resolves for signed-in users (private repo)."
            : "Public CDN link copied to clipboard.",
        );
      } catch {
        toast("err", "Clipboard blocked by the browser.");
      }
    },
    [toast],
  );

  /* ── Drag & drop from the OS ────────────────────────────── */

  useEffect(() => {
    if (!repo) return;
    // Internal drags carry MOVE_MIME, not "Files" — this veil is only for
    // files coming from outside the browser.
    const isExternal = (e: DragEvent) =>
      e.dataTransfer?.types.includes("Files") &&
      !e.dataTransfer.types.includes(MOVE_MIME);

    const over = (e: DragEvent) => {
      if (!isExternal(e)) return;
      e.preventDefault();
      dragDepth.current++;
      setDragging(true);
    };
    const leave = (e: DragEvent) => {
      e.preventDefault();
      if (--dragDepth.current <= 0) setDragging(false);
    };
    const move = (e: DragEvent) => e.preventDefault();
    const drop = (e: DragEvent) => {
      dragDepth.current = 0;
      setDragging(false);
      if (!isExternal(e)) return;
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length) upload(files);
    };

    window.addEventListener("dragenter", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", move);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", move);
      window.removeEventListener("drop", drop);
    };
  }, [repo, upload]);

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        repos={repos}
        loading={reposLoading}
        selected={repo}
        onSelect={selectRepo}
        onNewRepo={() => setDialog({ kind: "repo" })}
        canPrivate={canPrivate}
        user={user}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        {!repo ? (
          <>
            {/* Without a repo there's no toolbar, so the drawer would be
                unreachable on a phone. */}
            <div className="p-3 lg:hidden">
              <button
                onClick={() => setNavOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-raised/60 px-3 py-2 text-[12px] text-ink-soft"
              >
                <MenuIcon className="size-4" />
                Buckets
              </button>
            </div>
            <Empty
              title="Pick a bucket"
              body="Choose a repository from the menu and it becomes your media store. Any repo you own will do — an empty one is a perfectly good place to start."
              action={
                lastRepo
                  ? { label: `Open ${lastRepo}`, onClick: () => selectRepo(lastRepo) }
                  : undefined
              }
            />
          </>
        ) : (
          <>
            <Toolbar
              repo={repo}
              listing={listing}
              crumbs={crumbs}
              onCrumb={(i) =>
                goPath(i < 0 ? "" : crumbs.slice(0, i + 1).join("/"))
              }
              onDropCrumb={(i, from) =>
                move(from, i < 0 ? "" : crumbs.slice(0, i + 1).join("/"))
              }
              branches={branches}
              branch={branch}
              defaultBranch={defaultBranch}
              branchLoading={branchLoading}
              onBranch={selectBranch}
              filter={filter}
              setFilter={setFilter}
              view={view}
              setView={setView}
              onPick={() => fileInput.current?.click()}
              onNewFolder={() => setDialog({ kind: "folder" })}
              onMenu={() => setNavOpen(true)}
              rate={rate}
            />

            <section className="min-h-0 flex-1 overflow-y-auto px-3 pb-28 pt-4 sm:px-5">
              {listing?.repo.private && (
                <Notice id="private-links" title="This bucket is private">
                  Files here have no public URL — links only work for people
                  signed into this app, so they can&apos;t be embedded in a
                  public website. Use a public bucket for anything your site
                  needs to display.
                </Notice>
              )}

              {listing && listing.repo.size / (1024 * 1024) >= 0.8 && (
                <Notice id="repo-size" tone="danger" title="This repo is nearly full">
                  It&apos;s at {formatBytes(listing.repo.size * 1024)} of
                  GitHub&apos;s 1 GB soft limit. GitHub starts emailing you past
                  that, and hard-caps at 5 GB. Time to split into a second
                  bucket.
                </Notice>
              )}

              {loading ? (
                <SkeletonGrid />
              ) : err ? (
                <Empty title="Couldn't open this repo" body={err} tone="err" />
              ) : items.length === 0 ? (
                <Empty
                  title={filter ? "Nothing matches" : "This folder is empty"}
                  body={
                    filter
                      ? `No file here matches "${filter}".`
                      : "Drag files anywhere on this page to upload them, or start a folder to organise things."
                  }
                />
              ) : (
                <MediaGrid
                  items={items}
                  view={view}
                  onOpen={(item) =>
                    setLightbox(viewable.findIndex((v) => v.sha === item.sha))
                  }
                  onEnterDir={goPath}
                  onDelete={remove}
                  onDownload={download}
                  onRename={(item) => setDialog({ kind: "rename", item })}
                  onMove={(from, toDir) => move(from, toDir)}
                />
              )}
            </section>
          </>
        )}

        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            upload(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />

        <Uploads jobs={jobs} onClear={() => setJobs([])} />
      </main>

      {dragging && <DropVeil repo={repo!} path={path} branch={branch} />}

      {dialog?.kind === "repo" && (
        <NewRepo
          canPrivate={canPrivate}
          onCancel={() => setDialog(null)}
          onCreate={createRepo}
        />
      )}

      {dialog?.kind === "folder" && (
        <Prompt
          title="New folder"
          hint={`Created in ${repo}${path ? `/${path}` : ""} on ${branch}. Git can't store an empty folder, so this adds a hidden .gitkeep inside it.`}
          onCancel={() => setDialog(null)}
          onConfirm={createFolder}
        />
      )}

      {dialog?.kind === "rename" && (
        <Prompt
          title="Rename file"
          initial={dialog.item.name}
          confirmLabel="Rename"
          hint="Git has no rename — this lands as a single commit that moves the file."
          onCancel={() => setDialog(null)}
          onConfirm={(name) => {
            const item = dialog.item;
            setDialog(null);
            move(item.path, path, name);
          }}
        />
      )}

      {lightbox !== null && viewable[lightbox] && (
        <Lightbox
          items={viewable}
          index={lightbox}
          onIndex={setLightbox}
          onClose={() => setLightbox(null)}
          onDelete={remove}
          onDownload={download}
          onCopyLink={copyLink}
        />
      )}
    </div>
  );
}

/* ── Pieces ───────────────────────────────────────────────── */

function Toolbar({
  repo,
  listing,
  crumbs,
  onCrumb,
  onDropCrumb,
  branches,
  branch,
  defaultBranch,
  branchLoading,
  onBranch,
  filter,
  setFilter,
  view,
  setView,
  onPick,
  onNewFolder,
  onMenu,
  rate,
}: {
  repo: string;
  listing: Listing | null;
  onMenu: () => void;
  rate: Rate;
  crumbs: string[];
  onCrumb: (i: number) => void;
  onDropCrumb: (i: number, from: string) => void;
  branches: Branch[];
  branch: string | null;
  defaultBranch: string | null;
  branchLoading: boolean;
  onBranch: (b: string) => void;
  filter: string;
  setFilter: (s: string) => void;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  onPick: () => void;
  onNewFolder: () => void;
}) {
  const isPrivate = listing?.repo.private;
  const [over, setOver] = useState<number | null>(null);

  // Breadcrumbs double as drop targets, which is how you move a file *up*.
  const crumbDrop = (i: number) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(MOVE_MIME)) return;
      e.preventDefault();
      setOver(i);
    },
    onDragLeave: () => setOver(null),
    onDrop: (e: React.DragEvent) => {
      const from = e.dataTransfer.getData(MOVE_MIME);
      setOver(null);
      if (!from) return;
      e.preventDefault();
      onDropCrumb(i, from);
    },
  });

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-line bg-void/70 px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-3.5">
      {/* Two rows on a phone (breadcrumb, then controls); one row from `sm` up. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-raised/60 text-ink-soft transition-colors hover:text-ink lg:hidden"
        >
          <MenuIcon className="size-4" />
        </button>

        <nav className="flex min-w-0 flex-1 items-center gap-1 text-[13px]">
          <button
            onClick={() => onCrumb(-1)}
            {...crumbDrop(-1)}
            className={`max-w-[14rem] truncate rounded px-1 py-0.5 font-medium transition-colors ${
              over === -1
                ? "bg-iris/25 text-ink ring-1 ring-iris"
                : "text-ink hover:text-iris-soft"
            }`}
          >
            {repo.split("/")[1]}
          </button>

          {listing && (
            <span
              title={
                isPrivate
                  ? "Private repo — files are proxied through your session"
                  : "Public repo — files are served from the GitHub CDN"
              }
              className={`ml-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                isPrivate ? "bg-amber/12 text-amber" : "bg-lime/12 text-lime"
              }`}
            >
              {isPrivate ? (
                <LockIcon className="size-2.5" />
              ) : (
                <GlobeIcon className="size-2.5" />
              )}
              {isPrivate ? "Private" : "Public"}
            </span>
          )}

          {crumbs.map((c, i) => (
            <span key={i} className="flex min-w-0 items-center">
              <ChevronIcon className="size-3.5 shrink-0 text-ink-faint" />
              <button
                onClick={() => onCrumb(i)}
                {...crumbDrop(i)}
                className={`truncate rounded px-1 py-0.5 transition-colors ${
                  over === i
                    ? "bg-iris/25 text-ink ring-1 ring-iris"
                    : i === crumbs.length - 1
                      ? "text-ink"
                      : "text-ink-soft hover:text-ink"
                }`}
              >
                {c}
              </button>
            </span>
          ))}
        </nav>

      </div>

      {/* Controls get their own row below `sm` — sharing one with the
          breadcrumb crushed the repo name to a single letter. */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <BranchPicker
          branches={branches}
          current={branch}
          defaultBranch={defaultBranch}
          loading={branchLoading}
          onPick={onBranch}
        />

        <div className="group relative hidden flex-1 lg:block">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint transition-colors group-focus-within:text-iris-soft" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter files"
            className="w-40 rounded-lg border border-line bg-raised/60 py-1.5 pl-8 pr-2.5 text-[12px] transition-[width] duration-300 ease-out-expo placeholder:text-ink-faint focus:w-56 focus:border-iris/50 focus:outline-none"
          />
        </div>

        <div className="flex shrink-0 rounded-lg border border-line bg-raised/60 p-0.5">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-label={`${v} view`}
              aria-pressed={view === v}
              className={`grid size-7 place-items-center rounded-md transition-colors ${
                view === v
                  ? "bg-hover-strong text-ink"
                  : "text-ink-faint hover:text-ink-soft"
              }`}
            >
              {v === "grid" ? (
                <GridIcon className="size-3.5" />
              ) : (
                <ListIcon className="size-3.5" />
              )}
            </button>
          ))}
        </div>

        <Limits
          rate={rate}
          repoSizeKb={listing?.repo.size ?? null}
          isPrivate={listing?.repo.private ?? null}
        />

        <button
          onClick={onNewFolder}
          title="New folder"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-raised/60 text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
        >
          <FolderPlusIcon className="size-4" />
        </button>

        <button
          onClick={onPick}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-2.5 py-2 text-[12px] font-medium text-void transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-10px_rgba(255,255,255,0.4)] sm:px-3.5"
        >
          <UploadIcon className="size-3.5" />
          <span className="hidden sm:inline">Upload</span>
        </button>
      </div>
      </div>
    </header>
  );
}

function DropVeil({
  repo,
  path,
  branch,
}: {
  repo: string;
  path: string;
  branch: string | null;
}) {
  return (
    <div className="animate-fade pointer-events-none fixed inset-0 z-40 grid place-items-center bg-void/75 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-iris/60 bg-iris/6 px-16 py-14">
        <div className="grid size-14 place-items-center rounded-2xl bg-iris/18 text-iris-soft">
          <UploadIcon className="size-6" />
        </div>
        <div className="text-center">
          <p className="text-base font-medium">Drop to upload</p>
          <p className="mt-1 font-mono text-xs text-ink-faint">
            {repo}/{path} @ {branch}
          </p>
          <p className="mt-2 text-[11px] text-ink-faint/70">
            Images over 95 MB are compressed to fit.
          </p>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:[grid-template-columns:repeat(auto-fill,minmax(11.5rem,1fr))]">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-card skeleton" />
      ))}
    </div>
  );
}

function Empty({
  title,
  body,
  tone,
  action,
}: {
  title: string;
  body: string;
  tone?: "err";
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="grid h-full min-h-[24rem] place-items-center px-6">
      <div className="animate-rise max-w-sm text-center">
        <div
          className={`mx-auto mb-5 grid size-12 place-items-center rounded-xl ${
            tone === "err" ? "bg-rose/12 text-rose" : "bg-iris/12 text-iris-soft"
          }`}
        >
          <SparkIcon className="size-5" />
        </div>
        <h2 className="text-base font-medium">{title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">{body}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[12px] font-medium text-void transition-all duration-200 hover:-translate-y-0.5"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
