/**
 * Every location in the vault has a URL, so refresh, back/forward, bookmarks
 * and shared links all work:
 *
 *   /vault                              repo picker
 *   /vault/owner/repo                   repo root on its default branch
 *   /vault/owner/repo/some/folder       a folder inside it
 *   ?branch=name                        any non-default branch
 */
export function vaultUrl(
  repo: string | null,
  path = "",
  branch?: string | null,
  defaultBranch?: string | null,
): string {
  if (!repo) return "/vault";
  const segments = [...repo.split("/"), ...path.split("/")]
    .filter(Boolean)
    .map(encodeURIComponent);
  const url = `/vault/${segments.join("/")}`;
  return branch && branch !== defaultBranch
    ? `${url}?branch=${encodeURIComponent(branch)}`
    : url;
}
