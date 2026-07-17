import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

/**
 * The `repo` scope is what lets us read and write *private* repositories.
 * Downgrade to `public_repo` if you only ever want public buckets.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      authorization: { params: { scope: "read:user user:email repo" } },
    }),
  ],
  callbacks: {
    jwt({ token, account, profile }) {
      if (account?.access_token) token.accessToken = account.access_token;
      if (profile?.login) token.login = profile.login as string;
      return token;
    },
    session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.login = token.login as string | undefined;
      return session;
    },
  },
  pages: { signIn: "/" },
});
