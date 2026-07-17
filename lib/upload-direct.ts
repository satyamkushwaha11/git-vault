/**
 * Uploads straight from the browser to the GitHub API.
 *
 * Going through our own server would mean the file crosses the host's request
 * body limit — 4.5 MB on Vercel — which caps uploads far below what GitHub
 * itself allows. api.github.com sends permissive CORS headers, so the browser
 * can PUT to it directly and the only ceiling left is GitHub's real one.
 */

/** GitHub hard-rejects blobs over 100 MB; leave headroom for the JSON envelope. */
export const MAX_BYTES = 95 * 1024 * 1024;

/** Encoding the whole file at once blows the call stack on large inputs. */
function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export type DirectResult = { sha: string; path: string };

export function uploadDirect({
  token,
  repo,
  branch,
  path,
  file,
  onProgress,
}: {
  token: string;
  repo: string;
  branch: string;
  path: string;
  file: File;
  onProgress?: (fraction: number) => void;
}): Promise<DirectResult> {
  return new Promise(async (resolve, reject) => {
    let content: string;
    try {
      content = toBase64(await file.arrayBuffer());
    } catch {
      reject(new Error(`"${file.name}" is too large for the browser to encode.`));
      return;
    }

    const [owner, name] = repo.split("/");
    const url = `https://api.github.com/repos/${owner}/${name}/contents/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Accept", "application/vnd.github+json");
    xhr.setRequestHeader("X-GitHub-Api-Version", "2022-11-28");
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.upload.onprogress = (e) =>
      e.lengthComputable && onProgress?.(e.loaded / e.total);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText);
          resolve({ sha: body.content?.sha ?? "", path });
        } catch {
          resolve({ sha: "", path });
        }
        return;
      }

      let msg = `GitHub rejected the upload (${xhr.status})`;
      try {
        msg = JSON.parse(xhr.responseText).message ?? msg;
      } catch {}
      if (xhr.status === 422) msg = `"${file.name}" already exists in this folder`;
      if (xhr.status === 401)
        msg = "Your GitHub session expired. Sign out and back in.";
      if (xhr.status === 403)
        msg = "GitHub refused the write — check the token has repo access, or you may be rate limited.";
      reject(new Error(msg));
    };

    xhr.onerror = () =>
      reject(new Error(`Network error while uploading "${file.name}"`));

    xhr.send(JSON.stringify({ message: `Upload ${path}`, content, branch }));
  });
}
