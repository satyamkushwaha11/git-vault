"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { GitHubIcon, GlobeIcon, LockIcon, SparkIcon } from "./icons";

const FEATURES = [
  {
    icon: <LockIcon className="size-5" />,
    title: "Private or public",
    body: "Point it at any repo you own. Public buckets hotlink the GitHub CDN; private ones stream through your session, so nothing leaks.",
  },
  {
    icon: <GlobeIcon className="size-5" />,
    title: "Real URLs",
    body: "Every public file gets a permanent raw.githubusercontent.com link you can drop straight into your site.",
  },
  {
    icon: <SparkIcon className="size-5" />,
    title: "Versioned by default",
    body: "It's still just git. Every upload is a commit, every delete is reversible, and the history is right there.",
  },
];

export default function Landing() {
  const [busy, setBusy] = useState(false);

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-6 py-20">
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      {/* Faint grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(40rem_28rem_at_50%_30%,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative flex flex-col items-center text-center">
        <div className="animate-fade mb-7 inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-xs text-ink-soft glass">
          <span className="size-1.5 rounded-full bg-lime shadow-[0_0_8px_var(--color-lime)]" />
          Backed by a repo you already own
        </div>

        <h1
          className="animate-rise text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl"
          style={{ animationDelay: "60ms" }}
        >
          Your media,
          <br />
          <span className="bg-gradient-to-br from-iris-soft via-ink to-aqua bg-clip-text text-transparent">
            stored in GitHub.
          </span>
        </h1>

        <p
          className="animate-rise mt-6 max-w-xl text-pretty text-base leading-relaxed text-ink-soft sm:text-lg"
          style={{ animationDelay: "140ms" }}
        >
          Turn any repository into a media bucket. Drag files in, browse them in
          a real gallery, and pull permanent links into your website — without
          paying for object storage.
        </p>

        <button
          onClick={() => {
            setBusy(true);
            signIn("github", { redirectTo: "/vault" });
          }}
          disabled={busy}
          style={{ animationDelay: "220ms" }}
          className="animate-rise group mt-10 inline-flex items-center gap-2.5 rounded-xl bg-ink px-6 py-3.5 text-sm font-medium text-void transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(255,255,255,0.35)] active:translate-y-0 disabled:opacity-60"
        >
          {busy ? (
            <span className="size-4 animate-spin-slow rounded-full border-2 border-void/25 border-t-void" />
          ) : (
            <GitHubIcon className="size-4" />
          )}
          {busy ? "Redirecting…" : "Continue with GitHub"}
        </button>

        <p
          className="animate-fade mt-4 text-xs text-ink-faint"
          style={{ animationDelay: "300ms" }}
        >
          Asks for repo access so it can read and write private buckets.
        </p>
      </div>

      <div className="relative mt-24 grid w-full gap-4 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className="animate-rise group rounded-card p-5 text-left transition-colors duration-300 glass hover:border-line-strong"
            style={{ animationDelay: `${360 + i * 80}ms` }}
          >
            <div className="mb-3.5 inline-flex size-9 items-center justify-center rounded-lg bg-iris/12 text-iris-soft transition-transform duration-300 group-hover:scale-110">
              {f.icon}
            </div>
            <h3 className="text-sm font-medium">{f.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-faint">
              {f.body}
            </p>
          </div>
        ))}
      </div>

      <p className="animate-fade relative mt-14 max-w-lg text-center text-xs leading-relaxed text-ink-faint/80">
        Heads up: GitHub caps files at 100 MB and asks that repos not be used as
        a general-purpose CDN. Great for a portfolio or side project — not a
        replacement for S3.
      </p>
    </main>
  );
}
