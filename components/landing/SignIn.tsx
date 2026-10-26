"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FULL_SCOPE } from "@/lib/scopes";
import { AlertIcon, GitHubIcon, LockIcon } from "../icons";

const ERRORS: Record<string, string> = {
  AccessDenied: "You closed GitHub's permission screen, so nothing was connected. Try again whenever you like.",
  OAuthCallbackError: "GitHub didn't finish the sign-in. Please try once more.",
  Callback: "GitHub didn't finish the sign-in. Please try once more.",
  Configuration: "Sign-in is misconfigured on the server. This is on us, not you.",
};

/** Auth.js sends failed sign-ins back here with `?error=`; show it instead of a blank stare. */
function ErrorNotice() {
  const code = useSearchParams().get("error");
  if (!code) return null;
  return (
    <div
      role="alert"
      className="animate-rise mb-5 flex max-w-md items-start gap-2.5 rounded-xl border border-rose/30 bg-rose/8 px-3.5 py-3 text-left text-[13px] leading-relaxed text-ink-soft"
    >
      <AlertIcon className="mt-0.5 size-4 shrink-0 text-rose" />
      <span>{ERRORS[code] ?? "Sign-in didn't go through. Please try again."}</span>
    </div>
  );
}

export default function SignIn({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const [busy, setBusy] = useState<"public" | "private" | null>(null);

  const go = (level: "public" | "private") => {
    setBusy(level);
    signIn(
      "github",
      { redirectTo: "/vault" },
      level === "private" ? { scope: FULL_SCOPE } : undefined,
    );
  };

  if (compact) {
    return (
      <button
        onClick={() => go("public")}
        disabled={busy !== null}
        className={`inline-flex items-center gap-2 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-void transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 ${className}`}
      >
        <GitHubIcon className="size-4" />
        {busy ? "Redirecting…" : "Sign in"}
      </button>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Suspense>
        <ErrorNotice />
      </Suspense>

      <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
        <button
          onClick={() => go("public")}
          disabled={busy !== null}
          className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-ink px-6 py-3.5 text-sm font-medium text-void transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)] active:translate-y-0 disabled:opacity-60"
        >
          {busy === "public" ? (
            <span className="size-4 animate-spin-slow rounded-full border-2 border-void/25 border-t-void" />
          ) : (
            <GitHubIcon className="size-4" />
          )}
          {busy === "public" ? "Redirecting…" : "Continue with GitHub"}
        </button>

        <button
          onClick={() => go("private")}
          disabled={busy !== null}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-5 py-3.5 text-sm font-medium text-ink-soft transition-colors glass hover:border-line-strong hover:text-ink disabled:opacity-60"
        >
          <LockIcon className="size-3.5" />
          {busy === "private" ? "Redirecting…" : "Include private repos"}
        </button>
      </div>

      <p className="mt-3.5 max-w-sm text-center text-xs leading-relaxed text-ink-faint">
        The first button only asks for access to your <strong className="font-medium text-ink-soft">public</strong> repositories.
        You can add private access later, and revoke either at any time from GitHub.
      </p>
    </div>
  );
}
