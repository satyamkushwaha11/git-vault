/**
 * Two levels of GitHub access. The landing page defaults to public-only so the
 * consent screen asks for as little as possible; private access is an opt-in
 * upgrade from inside the app. GitHub reports the scopes it actually granted
 * on the token response, and that string is what `hasPrivateScope` reads.
 */
export const PUBLIC_SCOPE = "read:user user:email public_repo";
export const FULL_SCOPE = "read:user user:email repo";

/** Sessions created before scopes were recorded were all full-access. */
export function hasPrivateScope(scope?: string | null): boolean {
  if (!scope) return true;
  return scope.split(/[,\s]+/).includes("repo");
}
