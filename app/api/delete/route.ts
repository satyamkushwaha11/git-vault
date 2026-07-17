import { auth } from "@/auth";
import {
  deleteFile,
  getRepo,
  listTree,
  commitTree,
  GitHubError,
} from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { repo: full, path, sha, type, branch: wanted } = await req.json();
  if (!full?.includes("/") || !path)
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const [owner, repo] = full.split("/");
  const token = session.accessToken;

  try {
    const meta = await getRepo(token, owner, repo);
    const branch = wanted || meta.default_branch;

    if (type === "dir") {
      const { tree, truncated } = await listTree(token, owner, repo, branch);

      if (truncated)
        return NextResponse.json(
          {
            error:
              "This repo is too large to delete folders safely. Remove the files individually.",
          },
          { status: 422 },
        );

      const prefix = `${path}/`;
      const doomed = tree.filter(
        (n) => n.type === "blob" && n.path.startsWith(prefix),
      );

      if (!doomed.length)
        return NextResponse.json({ error: "Folder is empty" }, { status: 404 });

      // One commit removes the whole subtree, rather than N commits for N files.
      await commitTree(
        token,
        owner,
        repo,
        branch,
        doomed.map((n) => ({
          path: n.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: null,
        })),
        `Delete ${path}/ (${doomed.length} file${doomed.length > 1 ? "s" : ""})`,
      );

      return NextResponse.json({ ok: true, removed: doomed.length });
    }

    if (!sha)
      return NextResponse.json({ error: "Missing sha" }, { status: 400 });

    await deleteFile(token, owner, repo, path, sha, `Delete ${path}`, branch);
    return NextResponse.json({ ok: true, removed: 1 });
  } catch (e) {
    const err = e as GitHubError;
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 500 },
    );
  }
}
