import { auth } from "@/auth";
import { createRepo, safeSegment, GitHubError } from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { name, private: isPrivate = true, description } = await req.json();

  const clean = safeSegment(String(name ?? ""))?.replace(/\s+/g, "-");
  if (!clean)
    return NextResponse.json({ error: "Invalid repo name" }, { status: 400 });

  try {
    const repo = await createRepo(
      session.accessToken,
      clean,
      Boolean(isPrivate),
      description,
    );
    return NextResponse.json({
      ok: true,
      repo: {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        owner: repo.owner.login,
        avatar: repo.owner.avatar_url,
        branch: repo.default_branch,
        updated_at: repo.updated_at,
        size: repo.size,
        description: repo.description,
      },
    });
  } catch (e) {
    const err = e as GitHubError;
    const msg =
      err.status === 422
        ? `You already have a repository called "${clean}"`
        : err.message;
    return NextResponse.json({ error: msg }, { status: err.status ?? 500 });
  }
}
