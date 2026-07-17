import { auth } from "@/auth";
import { fetchBlob, mimeOf } from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

/**
 * Streams a blob out of a private repo. Public repos never hit this route —
 * they hotlink raw.githubusercontent.com directly.
 *
 * GitHub's Blobs API has no Range support, which is why private video used to
 * be unseekable: the browser can't scrub without partial requests. We fetch the
 * blob once, cache the bytes, and serve real 206 responses out of that cache —
 * so seeking works, and only the first request pays for the download.
 */

type Entry = { bytes: Buffer; at: number };

/** Content-addressed by sha, so cached bytes can never go stale. */
const cache = new Map<string, Entry>();
const MAX_CACHE_BYTES = 256 * 1024 * 1024;
const MAX_ENTRY_BYTES = 64 * 1024 * 1024;

function cacheSize() {
  let n = 0;
  for (const e of cache.values()) n += e.bytes.length;
  return n;
}

function remember(sha: string, bytes: Buffer) {
  if (bytes.length > MAX_ENTRY_BYTES) return;
  cache.set(sha, { bytes, at: Date.now() });
  // Evict least-recently-used until we're back under budget.
  while (cacheSize() > MAX_CACHE_BYTES && cache.size > 1) {
    let oldest: string | null = null;
    let oldestAt = Infinity;
    for (const [k, v] of cache) {
      if (v.at < oldestAt) {
        oldestAt = v.at;
        oldest = k;
      }
    }
    if (!oldest) break;
    cache.delete(oldest);
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const full = p.get("repo");
  const sha = p.get("sha");
  const name = p.get("name") ?? "file";
  const download = p.get("download") === "1";

  if (!full?.includes("/") || !sha)
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const [owner, repo] = full.split("/");
  const type = mimeOf(name);
  const disposition = `${download ? "attachment" : "inline"}; filename="${name.replace(/"/g, "")}"`;

  const hit = cache.get(sha);
  let bytes: Buffer;

  if (hit) {
    hit.at = Date.now();
    bytes = hit.bytes;
  } else {
    const upstream = await fetchBlob(session.accessToken, owner, repo, sha);
    if (!upstream.ok)
      return NextResponse.json(
        { error: `GitHub returned ${upstream.status}` },
        { status: upstream.status },
      );
    bytes = Buffer.from(await upstream.arrayBuffer());
    remember(sha, bytes);
  }

  const range = req.headers.get("range");
  const base = {
    "Content-Type": type,
    "Content-Disposition": disposition,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=31536000, immutable",
  };

  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m) {
      const total = bytes.length;
      // An open-ended suffix ("bytes=-500") means the *last* N bytes.
      let start = m[1] ? parseInt(m[1], 10) : total - parseInt(m[2] || "0", 10);
      let end = m[1] && m[2] ? parseInt(m[2], 10) : total - 1;
      start = Math.max(0, start);
      end = Math.min(end, total - 1);

      if (start > end || start >= total)
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${total}` },
        });

      const slice = new Uint8Array(bytes.subarray(start, end + 1));
      return new Response(slice, {
        status: 206,
        headers: {
          ...base,
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Content-Length": String(slice.length),
        },
      });
    }
  }

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { ...base, "Content-Length": String(bytes.length) },
  });
}
