import { auth } from "@/auth";
import { getRepo, listBranches, GitHubError } from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const full = req.nextUrl.searchParams.get("repo");
  if (!full?.includes("/"))
    return NextResponse.json({ error: "Bad repo" }, { status: 400 });

  const [owner, repo] = full.split("/");
  try {
    const [meta, branches] = await Promise.all([
      getRepo(session.accessToken, owner, repo),
      listBranches(session.accessToken, owner, repo),
    ]);
    return NextResponse.json({
      default: meta.default_branch,
      branches: branches.map((b) => ({
        name: b.name,
        protected: b.protected,
      })),
    });
  } catch (e) {
    const err = e as GitHubError;
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 500 },
    );
  }
}
