import { auth } from "@/auth";
import { getRepo, listDir, kindOf, KEEP, GitHubError } from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const full = p.get("repo");
  const path = p.get("path") ?? "";
  const wanted = p.get("branch") ?? undefined;

  if (!full?.includes("/"))
    return NextResponse.json({ error: "Bad repo" }, { status: 400 });

  const [owner, repo] = full.split("/");

  try {
    const meta = await getRepo(session.accessToken, owner, repo);
    const branch = wanted || meta.default_branch;
    const entries = await listDir(
      session.accessToken,
      owner,
      repo,
      path,
      branch,
    );

    const items = entries
      // .gitkeep only exists to stop Git from dropping an empty folder; it's
      // plumbing, not content.
      .filter((e) => e.name !== KEEP)
      .map((e) => {
        const kind = e.type === "dir" ? "dir" : kindOf(e.name);
        // Public repos can be hotlinked straight off the CDN — no proxy, no
        // API quota. Private ones have no public URL, so they must be streamed
        // back through us with the user's token attached.
        const url =
          e.type === "dir"
            ? null
            : meta.private
              ? `/api/raw?repo=${encodeURIComponent(full)}&sha=${e.sha}&name=${encodeURIComponent(e.name)}`
              : `https://raw.githubusercontent.com/${full}/${encodeURIComponent(
                  branch,
                )}/${e.path.split("/").map(encodeURIComponent).join("/")}`;
        return {
          name: e.name,
          path: e.path,
          sha: e.sha,
          size: e.size,
          type: e.type,
          kind,
          url,
        };
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });

    return NextResponse.json({
      repo: {
        full_name: meta.full_name,
        private: meta.private,
        branch,
        default_branch: meta.default_branch,
        size: meta.size,
      },
      path,
      items,
    });
  } catch (e) {
    const err = e as GitHubError;
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 500 },
    );
  }
}
