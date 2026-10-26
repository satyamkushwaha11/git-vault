import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What changed in git-vault, and when.",
};

const ENTRIES: { date: string; title: string; items: string[] }[] = [
  {
    date: "26 Oct 2026",
    title: "A landing page you can try before you trust",
    items: [
      "Live, read-only demo of the gallery on the home page. Open folders, preview images, copy real GitHub links, and simulate an upload without signing in.",
      "Sign-in now defaults to public repositories only. Private access is a separate, opt-in button and can be enabled later from inside the app.",
      "New Security section spelling out exactly what each permission level allows, plus privacy and changelog pages.",
      "Failed sign-ins now show what went wrong instead of silently returning to the home page.",
      "Social preview card for links shared on LinkedIn, X and Slack.",
    ],
  },
  {
    date: "22 Oct 2026",
    title: "Every location gets a URL",
    items: [
      "Repo, folder and branch now live in the address bar. Refresh keeps your place, back and forward work, and folder links can be shared.",
      "Fixed GitHub sign-in failing with a configuration error after GitHub began sending an issuer parameter on the OAuth callback.",
      "Anonymous page-view analytics.",
    ],
  },
  {
    date: "17 Jul 2026",
    title: "First release",
    items: [
      "Browse any repo you own as a media gallery with grid and list views, a lightbox, and text previews.",
      "Drag-and-drop uploads straight from the browser to GitHub. Oversized images are compressed to fit under the 100 MB limit.",
      "Folders, rename, move and delete, each landing as a single commit.",
      "Public repos hand out permanent CDN links; private repos stream through your session.",
    ],
  },
];

export default function Changelog() {
  return (
    <>
      <main className="relative mx-auto max-w-2xl px-6 pb-10 pt-20">
        <Link href="/" className="text-[13px] text-ink-faint underline-offset-4 hover:underline">
          ← Back to git-vault
        </Link>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">Changelog</h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          Dated notes on what shipped. The full history is in the{" "}
          <a
            href="https://github.com/satyamkushwaha11/git-vault/commits/master"
            target="_blank"
            rel="noreferrer"
            className="text-ink underline-offset-4 hover:underline"
          >
            commit log
          </a>
          .
        </p>
        <ol className="mt-12 space-y-12 border-l border-line pl-6">
          {ENTRIES.map((e) => (
            <li key={e.date} className="relative">
              <span className="absolute -left-[1.85rem] top-1.5 size-3 rounded-full border-2 border-void bg-iris" />
              <time className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">{e.date}</time>
              <h2 className="mt-1.5 text-lg font-medium">{e.title}</h2>
              <ul className="mt-3 space-y-2">
                {e.items.map((t) => (
                  <li key={t} className="text-[14px] leading-relaxed text-ink-soft">
                    {t}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </main>
      <Footer />
    </>
  );
}
