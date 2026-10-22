import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Vault from "@/components/Vault";
import { ToastProvider } from "@/components/Toast";

/**
 * Optional catch-all: `/vault` shows the repo picker, `/vault/owner/repo/a/b`
 * opens folder `a/b` in that repo. The branch rides along as `?branch=`.
 */
export default async function VaultPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ branch?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { slug: raw = [] } = await params;
  const { branch } = await searchParams;

  // Next hands catch-all segments over still percent-encoded (unlike search
  // params), so "my%20folder" has to become "my folder" before it hits GitHub.
  const slug = raw.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });

  // `/vault/owner` on its own means nothing — send it back to the picker.
  if (slug.length === 1) redirect("/vault");

  const [owner, name, ...rest] = slug;
  const repo = owner && name ? `${owner}/${name}` : null;

  return (
    <ToastProvider>
      <Vault
        user={{ name: session.user.name, image: session.user.image }}
        token={session.accessToken}
        repo={repo}
        path={rest.join("/")}
        branchParam={(Array.isArray(branch) ? branch[0] : branch) ?? null}
      />
    </ToastProvider>
  );
}
