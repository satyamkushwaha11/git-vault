import { auth } from "@/auth";
import { listRepos, GitHubError } from "@/lib/github";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const repos = await listRepos(session.accessToken);
    return NextResponse.json(
      repos.map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        private: r.private,
        owner: r.owner.login,
        avatar: r.owner.avatar_url,
        branch: r.default_branch,
        updated_at: r.updated_at,
        size: r.size,
        description: r.description,
      })),
    );
  } catch (e) {
    const err = e as GitHubError;
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 500 },
    );
  }
}
