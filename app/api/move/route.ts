import { auth } from "@/auth";
import {
  getRepo,
  listTree,
  commitTree,
  safeSegment,
  GitHubError,
} from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

/**
 * Moves or renames a file. Git has no rename primitive — a move is just the
 * same blob appearing at a new path and vanishing from the old one, which the
 * Git Data API lets us express as a single commit.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { repo: full, from, toDir, rename, branch: wanted } = await req.json();
  if (!full?.includes("/") || typeof from !== "string" || !from)
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const [owner, repo] = full.split("/");
  const token = session.accessToken;

  const current = from.split("/").pop()!;
  const name = rename ? safeSegment(String(rename)) : current;
  if (!name)
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 });

  const dir = typeof toDir === "string" ? toDir.replace(/^\/|\/$/g, "") : "";
  const to = dir ? `${dir}/${name}` : name;

  if (to === from) return NextResponse.json({ ok: true, path: to });

  try {
    const meta = await getRepo(token, owner, repo);
    const branch = wanted || meta.default_branch;
    const { tree, truncated } = await listTree(token, owner, repo, branch);

    if (truncated)
      return NextResponse.json(
        { error: "This repo is too large to move files safely." },
        { status: 422 },
      );

    const node = tree.find((n) => n.path === from && n.type === "blob");
    if (!node)
      return NextResponse.json({ error: "File not found" }, { status: 404 });

    if (tree.some((n) => n.path === to))
      return NextResponse.json(
        { error: `"${name}" already exists in that folder` },
        { status: 409 },
      );

    await commitTree(
      token,
      owner,
      repo,
      branch,
      [
        { path: to, mode: "100644", type: "blob", sha: node.sha },
        { path: from, mode: "100644", type: "blob", sha: null },
      ],
      `Move ${from} → ${to}`,
    );

    return NextResponse.json({ ok: true, path: to });
  } catch (e) {
    const err = e as GitHubError;
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 500 },
    );
  }
}
