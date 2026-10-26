import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    /** Scopes GitHub actually granted, e.g. "public_repo,read:user,user:email". */
    scope?: string;
    login?: string;
  }
}
