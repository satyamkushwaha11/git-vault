import { auth } from "@/auth";
import { putFile, GitHubError } from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

/** GitHub's Contents API hard-rejects anything past 100 MB; stay well under. */
const MAX_BYTES = 40 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const full = String(form.get("repo") ?? "");
  const dir = String(form.get("path") ?? "");
  const branch = String(form.get("branch") ?? "") || undefined;

  if (!(file instanceof File))
    return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!full.includes("/"))
    return NextResponse.json({ error: "Bad repo" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json(
      { error: `"${file.name}" is over the 40 MB limit` },
      { status: 413 },
    );

  const [owner, repo] = full.split("/");
  const safe = file.name.replace(/[^\w.\- ]+/g, "_");
  const path = dir ? `${dir}/${safe}` : safe;

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const res = await putFile(
      session.accessToken,
      owner,
      repo,
      path,
      buf.toString("base64"),
      `Upload ${safe}`,
      branch,
    );
    return NextResponse.json({ ok: true, path, sha: res.content.sha });
  } catch (e) {
    const err = e as GitHubError;
    // 422 from the Contents API almost always means "this path already exists"
    // (we deliberately don't pass a sha, so overwrites are opt-in, not silent).
    const msg =
      err.status === 422
        ? `"${safe}" already exists in this folder`
        : err.message;
    return NextResponse.json({ error: msg }, { status: err.status ?? 500 });
  }
}
