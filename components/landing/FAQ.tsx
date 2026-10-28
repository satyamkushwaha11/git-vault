"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import { ChevronIcon } from "../icons";

const REPO = "https://github.com/satyamkushwaha11/git-vault";

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is this against GitHub's terms of service?",
    a: (
      <>
        GitHub asks that repos not be used as a general-purpose CDN for
        production traffic — but a personal site, portfolio, or docs folder
        is exactly the scale git-vault is built for. If you expect heavy,
        sustained traffic, pair it with a real CDN or use S3/R2 instead.
      </>
    ),
  },
  {
    q: "What happens to my files if I revoke access?",
    a: (
      <>
        Nothing. Your files are ordinary commits in your own repository, not
        something git-vault stores — revoking the app from{" "}
        <a
          href="https://github.com/settings/applications"
          target="_blank"
          rel="noreferrer"
          className="text-ink-soft underline-offset-4 hover:underline"
        >
          github.com/settings/applications
        </a>{" "}
        just kills the session. The repo and its history stay exactly as they
        were.
      </>
    ),
  },
  {
    q: "Can I get my files back out later?",
    a: (
      <>
        Yes — it&apos;s just git. Clone the repo, pull it, or browse it
        directly on GitHub at any time. There is no export step and no
        lock-in, because there was never anywhere else your files lived.
      </>
    ),
  },
  {
    q: "What happens when my repo gets big?",
    a: (
      <>
        GitHub emails you past a 1 GB soft limit and hard-caps around 5 GB.
        The ⓘ meter in the app&apos;s toolbar shows live usage so you see it
        coming — splitting into a second bucket is just picking another repo,
        which takes a minute.
      </>
    ),
  },
  {
    q: "Do private repos work the same way?",
    a: (
      <>
        Mostly. Private files have no public URL — GitHub doesn&apos;t offer
        one — so every view streams through git-vault with your session
        attached, and links only resolve for someone signed in. Great for
        client hand-offs, not for embedding in a public site.
      </>
    ),
  },
  {
    q: "What does git-vault actually do with my GitHub access?",
    a: (
      <>
        Only what you see in the{" "}
        <a href="#security" className="text-ink-soft underline-offset-4 hover:underline">
          security table above
        </a>{" "}
        — list, read, and write files in the repos you choose. The whole app
        is open source, so you can read{" "}
        <a
          href={`${REPO}/blob/master/auth.ts`}
          target="_blank"
          rel="noreferrer"
          className="text-ink-soft underline-offset-4 hover:underline"
        >
          every line that touches your token
        </a>{" "}
        instead of taking that on faith.
      </>
    ),
  },
  {
    q: "Is it really free, forever?",
    a: (
      <>
        Yes. There&apos;s no subscription and no usage billing — you&apos;re
        using storage you already have, so there is nothing for git-vault to
        charge you for.
      </>
    ),
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto mt-32 max-w-3xl px-6">
      <Reveal className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-iris-soft">FAQ</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Questions worth answering up front.
        </h2>
      </Reveal>

      <Reveal delay={120} className="mt-10">
        <div className="divide-y divide-line overflow-hidden rounded-card glass">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[14px] font-medium transition-colors hover:text-iris-soft"
                >
                  {f.q}
                  <ChevronIcon
                    className={`size-4 shrink-0 text-ink-faint transition-transform duration-300 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-[max-height] duration-300 ease-out-expo ${
                    isOpen ? "max-h-40" : "max-h-0"
                  }`}
                >
                  <p className="px-5 pb-4 text-[13px] leading-relaxed text-ink-faint">
                    {f.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
