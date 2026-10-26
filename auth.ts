import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PUBLIC_SCOPE } from "@/lib/scopes";

/**
 * The provider defaults to `public_repo`. The "include private repos" buttons
 * pass `{ scope: FULL_SCOPE }` as authorization params to `signIn`, which
 * overrides this for that one request — see lib/scopes.ts.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      authorization: { params: { scope: PUBLIC_SCOPE } },
      // GitHub now returns `iss` on the callback (RFC 9207). Without this,
      // @auth/core <0.40 compares it against a placeholder and rejects every
      // sign-in with "unexpected iss (issuer) response parameter value".
      issuer: "https://github.com/login/oauth",
    }),
  ],
  callbacks: {
    jwt({ token, account, profile }) {
      if (account?.access_token) token.accessToken = account.access_token;
      // GitHub normalises the granted scopes onto the token response.
      if (account?.scope) token.scope = account.scope;
      if (profile?.login) token.login = profile.login as string;
      return token;
    },
    session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.scope = token.scope as string | undefined;
      session.login = token.login as string | undefined;
      return session;
    },
  },
  pages: { signIn: "/" },
});
