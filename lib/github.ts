const API = "https://api.github.com";

export type Repo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: { login: string; avatar_url: string };
  default_branch: string;
  updated_at: string;
  size: number;
  description: string | null;
};

export type Entry = {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir";
  download_url: string | null;
};

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function gh<T>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    let msg = body;
    try {
      msg = JSON.parse(body).message ?? body;
    } catch {}
    throw new GitHubError(msg || res.statusText, res.status);
  }
  return res.json() as Promise<T>;
}

export function listRepos(token: string) {
  return gh<Repo[]>(
    token,
    "/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator",
  );
}

export function getRepo(token: string, owner: string, repo: string) {
  return gh<Repo>(token, `/repos/${owner}/${repo}`);
}

/**
 * `auto_init` matters: a repo with no commits has no default branch, and the
 * tree/move/delete plumbing would have nothing to build on. The initial
 * commit gives us a real branch from the first second.
 */
export function createRepo(
  token: string,
  name: string,
  isPrivate: boolean,
  description?: string,
) {
  return gh<Repo>(token, "/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name,
      private: isPrivate,
      description: description || "Media bucket",
      auto_init: true,
    }),
  });
}

/** The 5,000/hour budget is shared across everything using this token. */
export function getRateLimit(token: string) {
  return gh<{
    resources: { core: { limit: number; remaining: number; reset: number } };
  }>(token, "/rate_limit");
}

export function listBranches(token: string, owner: string, repo: string) {
  return gh<{ name: string; protected: boolean }[]>(
    token,
    `/repos/${owner}/${repo}/branches?per_page=100`,
  );
}

export async function listDir(
  token: string,
  owner: string,
  repo: string,
  path = "",
  ref?: string,
): Promise<Entry[]> {
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const data = await gh<Entry[] | Entry>(
    token,
    `/repos/${owner}/${repo}/contents/${encodeURI(path)}${q}`,
  ).catch((e) => {
    // An empty repo has no root tree yet — that's an empty bucket, not an error.
    if (e instanceof GitHubError && e.status === 404) return [] as Entry[];
    throw e;
  });
  return Array.isArray(data) ? data : [data];
}

export function putFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  contentBase64: string,
  message: string,
  branch?: string,
  sha?: string,
) {
  return gh<{ content: Entry; commit: { sha: string } }>(
    token,
    `/repos/${owner}/${repo}/contents/${encodeURI(path)}`,
    {
      method: "PUT",
      body: JSON.stringify({ message, content: contentBase64, sha, branch }),
    },
  );
}

export function deleteFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  sha: string,
  message: string,
  branch?: string,
) {
  return gh<unknown>(
    token,
    `/repos/${owner}/${repo}/contents/${encodeURI(path)}`,
    { method: "DELETE", body: JSON.stringify({ message, sha, branch }) },
  );
}

/* ── Git Data API ─────────────────────────────────────────────
 *
 * The Contents API can only touch one file per commit, so a folder delete or
 * a move would mean N commits and N round-trips. These plumbing calls let us
 * rewrite a whole tree and land it as a single commit instead.
 */

type TreeEntry = {
  path: string;
  mode: "100644" | "100755" | "040000" | "120000" | "160000";
  type: "blob" | "tree" | "commit";
  sha: string | null;
};

export type TreeNode = {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
};

async function headCommit(token: string, owner: string, repo: string, branch: string) {
  const ref = await gh<{ object: { sha: string } }>(
    token,
    `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
  );
  const commit = await gh<{ tree: { sha: string } }>(
    token,
    `/repos/${owner}/${repo}/git/commits/${ref.object.sha}`,
  );
  return { commitSha: ref.object.sha, treeSha: commit.tree.sha };
}

/** Every blob in the repo, flattened. `truncated` means the repo is too big. */
export async function listTree(
  token: string,
  owner: string,
  repo: string,
  branch: string,
) {
  const { treeSha } = await headCommit(token, owner, repo, branch);
  return gh<{ tree: TreeNode[]; truncated: boolean }>(
    token,
    `/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
  );
}

/**
 * Rewrites the branch tip with `entries` layered on top of the current tree
 * and returns the new commit sha. An entry with `sha: null` removes a path —
 * that's how deletes and the "old half" of a move are expressed.
 */
export async function commitTree(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  entries: TreeEntry[],
  message: string,
) {
  const { commitSha, treeSha } = await headCommit(token, owner, repo, branch);

  const tree = await gh<{ sha: string }>(
    token,
    `/repos/${owner}/${repo}/git/trees`,
    {
      method: "POST",
      body: JSON.stringify({ base_tree: treeSha, tree: entries }),
    },
  );

  const commit = await gh<{ sha: string }>(
    token,
    `/repos/${owner}/${repo}/git/commits`,
    {
      method: "POST",
      body: JSON.stringify({ message, tree: tree.sha, parents: [commitSha] }),
    },
  );

  await gh<unknown>(
    token,
    `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    { method: "PATCH", body: JSON.stringify({ sha: commit.sha }) },
  );

  return commit.sha;
}

/**
 * The Contents API refuses to return file bodies over 1 MB, so anything
 * sizeable has to come through the Blobs API, which streams up to 100 MB.
 */
export async function fetchBlob(
  token: string,
  owner: string,
  repo: string,
  sha: string,
): Promise<Response> {
  return fetch(`${API}/repos/${owner}/${repo}/git/blobs/${sha}`, {
    headers: {
      Accept: "application/vnd.github.raw",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
}

/**
 * Git can't represent an empty directory — a folder exists only as long as
 * something lives inside it. So "create folder" writes this placeholder, and
 * the UI filters it back out.
 */
export const KEEP = ".gitkeep";

/** Rejects path traversal and the separators that would nest a folder. */
export function safeSegment(name: string): string | null {
  const clean = name.trim().replace(/[/\\]/g, "");
  if (!clean || clean === "." || clean === "..") return null;
  return clean.replace(/[^\w.\- ]+/g, "_");
}

/* ── Media classification ─────────────────────────────────── */

const IMAGE = ["png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "bmp", "ico"];
const VIDEO = ["mp4", "webm", "mov", "m4v", "ogv"];
const AUDIO = ["mp3", "wav", "ogg", "m4a", "flac", "aac"];
const DOC = ["pdf"];
const OFFICE = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];
// Anything the browser can render as plain text, which is most source files.
const TEXT = [
  "txt", "md", "markdown", "rst", "log", "csv", "tsv", "json", "jsonc",
  "yml", "yaml", "toml", "ini", "cfg", "conf", "env", "xml", "svg",
  "html", "htm", "css", "scss", "sass", "less",
  "js", "jsx", "mjs", "cjs", "ts", "tsx", "vue", "svelte",
  "py", "rb", "php", "go", "rs", "java", "kt", "swift", "c", "h", "cpp",
  "hpp", "cs", "sh", "bash", "zsh", "fish", "sql", "graphql", "prisma",
  "dockerfile", "gitignore", "editorconfig", "lock",
];

export type Kind =
  | "image"
  | "video"
  | "audio"
  | "doc"
  | "office"
  | "text"
  | "other";

export function kindOf(name: string): Kind {
  const lower = name.toLowerCase();
  const ext = lower.split(".").pop() ?? "";
  if (IMAGE.includes(ext)) return "image";
  if (VIDEO.includes(ext)) return "video";
  if (AUDIO.includes(ext)) return "audio";
  if (DOC.includes(ext)) return "doc";
  if (OFFICE.includes(ext)) return "office";
  // Extensionless conventions like `Dockerfile` or `LICENSE` are still text.
  if (TEXT.includes(ext) || !lower.includes(".")) return "text";
  return "other";
}

/** Text previews stream into memory, so cap what we're willing to fetch. */
export const TEXT_PREVIEW_LIMIT = 512 * 1024;

export function mimeOf(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    m4v: "video/x-m4v",
    ogv: "video/ogg",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    flac: "audio/flac",
    aac: "audio/aac",
    pdf: "application/pdf",
  };
  return map[ext] ?? "application/octet-stream";
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB"];
  let i = -1;
  do {
    n /= 1024;
    i++;
  } while (n >= 1024 && i < units.length - 1);
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}
