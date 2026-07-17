import { auth } from "@/auth";
import { getRateLimit, GitHubError } from "@/lib/github";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const data = await getRateLimit(session.accessToken);
    const core = data.resources.core;
    return NextResponse.json({
      limit: core.limit,
      remaining: core.remaining,
      resetAt: core.reset * 1000,
    });
  } catch (e) {
    const err = e as GitHubError;
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 500 },
    );
  }
}
