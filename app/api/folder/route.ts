import { auth } from "@/auth";
import { putFile, KEEP, safeSegment, GitHubError } from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

/** Creates a folder by committing an empty placeholder inside it. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { repo: full, path = "", name, branch } = await req.json();
  if (!full?.includes("/"))
    return NextResponse.json({ error: "Bad repo" }, { status: 400 });

  const segment = safeSegment(String(name ?? ""));
  if (!segment)
    return NextResponse.json({ error: "Invalid folder name" }, { status: 400 });

  const [owner, repo] = full.split("/");
  const dir = path ? `${path}/${segment}` : segment;

  try {
    await putFile(
      session.accessToken,
      owner,
      repo,
      `${dir}/${KEEP}`,
      "",
      `Create ${dir}/`,
      branch || undefined,
    );
    return NextResponse.json({ ok: true, path: dir });
  } catch (e) {
    const err = e as GitHubError;
    const msg =
      err.status === 422 ? `"${segment}" already exists` : err.message;
    return NextResponse.json({ error: msg }, { status: err.status ?? 500 });
  }
}
