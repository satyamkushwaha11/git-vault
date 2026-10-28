import Link from "next/link";
import { GitHubIcon } from "../icons";

const REPO = "https://github.com/satyamkushwaha11/git-vault";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Live demo", href: "/#demo" },
      { label: "How it works", href: "/#how" },
      { label: "Security", href: "/#security" },
      { label: "FAQ", href: "/#faq" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Source code", href: REPO },
      { label: "Documentation", href: `${REPO}#readme` },
      { label: "Report an issue", href: `${REPO}/issues/new` },
      { label: "Privacy", href: "/privacy" },
    ],
  },
  {
    title: "GitHub",
    links: [
      { label: "Manage app access", href: "https://github.com/settings/applications" },
      { label: "Repository limits", href: "https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github" },
      { label: "Create an account", href: "https://github.com/signup" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-28 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" className="size-7 rounded-lg" />
            <span className="text-sm font-semibold tracking-tight">git-vault</span>
          </div>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-faint">
            Media storage that is just a GitHub repository. Free, versioned,
            and entirely yours.
          </p>
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
          >
            <GitHubIcon className="size-3.5" />
            Star on GitHub
          </a>
        </div>

        {COLUMNS.map((c) => (
          <div key={c.title}>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              {c.title}
            </h4>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("http") ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] text-ink-soft transition-colors hover:text-ink"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="text-[13px] text-ink-soft transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-[11px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span>Open source under the MIT licence. Not affiliated with GitHub.</span>
          <span>
            GitHub caps files at 100 MB and asks that repos not be used as a
            general-purpose CDN. Great for a portfolio, not a replacement for S3.
          </span>
        </div>
      </div>
    </footer>
  );
}
