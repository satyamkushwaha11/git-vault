import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What git-vault stores, what it can access, and how to revoke it.",
};

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "What we store",
    p: [
      "Nothing about your files. git-vault has no database and no file storage. Every upload travels from your browser directly to GitHub's API and lands as a commit in a repository you own.",
      "Your session is a signed and encrypted cookie that holds the GitHub access token GitHub issued when you signed in, plus your display name and avatar URL. It lives in your browser and expires on its own.",
    ],
  },
  {
    h: "What passes through the server",
    p: [
      "Listing folders, creating folders, moving and deleting files are API calls made by the server with your token, so the server sees file names and paths while it forwards those requests. It does not keep them.",
      "If you open a file from a private repository, its bytes are streamed through the server to your browser because private files have no public URL. They are not written to disk or cached.",
    ],
  },
  {
    h: "Analytics",
    p: [
      "The site uses Vercel Web Analytics, which counts page views without cookies and without identifying individual visitors. No third-party advertising or tracking scripts are loaded.",
    ],
  },
  {
    h: "GitHub permissions",
    p: [
      "By default git-vault asks for public_repo, read:user and user:email. If you choose to include private repositories it asks for repo instead. It never asks for permission to delete repositories or to act on your behalf outside of the app.",
      "You can revoke access at any time at github.com/settings/applications. Doing so invalidates the token in your session immediately.",
    ],
  },
  {
    h: "Open source",
    p: [
      "The complete source code is public. The authentication configuration, every API route, and the upload path can be read and audited at github.com/satyamkushwaha11/git-vault.",
    ],
  },
];

export default function Privacy() {
  return (
    <>
      <main className="relative mx-auto max-w-2xl px-6 pb-10 pt-20">
        <Link href="/" className="text-[13px] text-ink-faint underline-offset-4 hover:underline">
          ← Back to git-vault
        </Link>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">Privacy</h1>
        <p className="mt-3 text-[15px] text-ink-soft">Last updated 26 October 2026.</p>
        <div className="mt-10 space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-medium">{s.h}</h2>
              {s.p.map((t, i) => (
                <p key={i} className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                  {t}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
