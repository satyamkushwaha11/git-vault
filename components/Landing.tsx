import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import SignIn from "./landing/SignIn";
import DemoVault from "./landing/DemoVault";
import HowItWorks from "./landing/HowItWorks";
import Trust from "./landing/Trust";
import FAQ from "./landing/FAQ";
import Footer from "./landing/Footer";
import Reveal from "./landing/Reveal";
import CopyForDesktop from "./landing/CopyForDesktop";
import { GitHubIcon } from "./icons";

const REPO = "https://github.com/satyamkushwaha11/git-vault";

const NAV = [
  { label: "Demo", href: "#demo" },
  { label: "How it works", href: "#how" },
  { label: "Security", href: "#security" },
  { label: "Compare", href: "#compare" },
  { label: "FAQ", href: "#faq" },
];

const COMPARE: { row: string; cells: (string | boolean)[] }[] = [
  { row: "Monthly cost for a portfolio", cells: ["Free", "Pay per GB and request", "Free tier, then paid", "Free"] },
  { row: "You own the storage", cells: [true, true, false, false] },
  { row: "Version history of every file", cells: [true, false, false, false] },
  { row: "Permanent public URLs", cells: [true, true, true, "Can change"] },
  { row: "Private option", cells: [true, true, true, false] },
  { row: "Setup time", cells: ["Under a minute", "An afternoon", "Minutes", "Minutes"] },
  { row: "Best for", cells: ["Side projects, docs, portfolios", "Production apps", "Image-heavy apps", "Sharing a screenshot"] },
];

const USES = [
  { title: "Portfolio & personal site", body: "Host every image your site shows without paying for a bucket. Links never break when you redeploy." },
  { title: "Notion, Obsidian & READMEs", body: "Paste a permanent link into any markdown. No more screenshots that vanish when a service shuts down." },
  { title: "Client hand-offs", body: "Keep deliverables in a private repo, browse them as a gallery, and keep the history of every revision." },
];

export default function Landing() {
  return (
    <div className="relative">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-line bg-void/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" className="size-7 rounded-lg" />
            <span className="text-sm font-semibold tracking-tight">git-vault</span>
          </Link>
          <nav className="hidden items-center gap-5 text-[13px] text-ink-soft md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors hover:text-ink">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              aria-label="Source on GitHub"
              className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft transition-colors hover:text-ink"
            >
              <GitHubIcon className="size-4" />
            </a>
            <ThemeToggle />
            <SignIn compact />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6">
        {/* Faint grid backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[48rem] [mask-image:radial-gradient(42rem_26rem_at_50%_20%,black,transparent)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--color-line) 1px, transparent 1px), linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="relative flex flex-col items-center pt-20 text-center sm:pt-28">
          <div className="animate-fade mb-7 inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-xs text-ink-soft glass">
            <span className="size-1.5 rounded-full bg-lime shadow-[0_0_8px_var(--color-lime)]" />
            Open source · Free forever · Backed by a repo you already own
          </div>

          <h1
            className="animate-rise max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl"
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
            Turn any repository into a media bucket. Drag files in, browse them
            in a real gallery, and paste permanent links into your website.
            No object storage bill, no new account, nothing stored on our side.
          </p>

          <div className="animate-rise mt-10" style={{ animationDelay: "220ms" }}>
            <SignIn />
            <a
              href="#demo"
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Or try the live demo below, no sign-in needed ↓
            </a>
            <div>
              <CopyForDesktop />
            </div>
          </div>

          <dl
            className="animate-fade mt-12 grid w-full max-w-2xl grid-cols-3 divide-x divide-line rounded-xl border border-line text-center glass"
            style={{ animationDelay: "320ms" }}
          >
            {[
              ["0", "servers storing your files"],
              ["100 MB", "per file, GitHub's limit"],
              ["∞", "versions, it's just git"],
            ].map(([v, l]) => (
              <div key={l} className="px-3 py-4">
                <dt className="text-xl font-semibold tracking-tight sm:text-2xl">{v}</dt>
                <dd className="mt-0.5 text-[11px] leading-snug text-ink-faint sm:text-xs">{l}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Live demo ───────────────────────────────────────── */}
        <section className="relative mt-16">
          <Reveal>
            <DemoVault />
          </Reveal>
          <Reveal delay={150} className="mt-5 text-center">
            <p className="text-[13px] text-ink-faint">
              This is the real gallery UI on a real public repo. Open folders, click an image,
              hover a tile to copy its GitHub link, or drop a file to see what an upload feels like.
            </p>
          </Reveal>
        </section>

        <HowItWorks />

        {/* ── Use cases ───────────────────────────────────────── */}
        <section className="mx-auto mt-32 max-w-6xl">
          <Reveal className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-iris-soft">Good for</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Anywhere you need a link that keeps working.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {USES.map((u, i) => (
              <Reveal key={u.title} delay={i * 110}>
                <article className="h-full rounded-card border-l-2 border-l-iris/60 p-5 glass">
                  <h3 className="text-[15px] font-medium">{u.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">{u.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <Trust />

        {/* ── Compare ─────────────────────────────────────────── */}
        <section id="compare" className="mx-auto mt-32 max-w-6xl">
          <Reveal className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-iris-soft">Compare</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Honest about where it fits.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-ink-soft">
              git-vault is not trying to replace S3. It is the right tool when your
              storage needs are small and your tolerance for bills and sign-ups is smaller.
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-12">
            <div className="overflow-x-auto rounded-card glass">
              <table className="w-full min-w-[40rem] text-left text-[13px]">
                <thead className="bg-void/60 text-[11px] uppercase tracking-wider text-ink-faint">
                  <tr>
                    <th className="px-5 py-3 font-semibold" />
                    <th className="px-4 py-3 font-semibold text-iris-soft">git-vault</th>
                    <th className="px-4 py-3 font-semibold">S3 / R2</th>
                    <th className="px-4 py-3 font-semibold">Cloudinary</th>
                    <th className="px-4 py-3 font-semibold">Imgur</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((r) => (
                    <tr key={r.row} className="border-t border-line">
                      <td className="px-5 py-3 font-medium text-ink-soft">{r.row}</td>
                      {r.cells.map((c, i) => (
                        <td key={i} className={`px-4 py-3 ${i === 0 ? "text-ink" : "text-ink-faint"}`}>
                          {c === true ? <span className="text-lime">Yes</span> : c === false ? <span>No</span> : c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </section>

        <FAQ />

        {/* ── Final CTA ───────────────────────────────────────── */}
        <section className="mt-32">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-line px-6 py-14 text-center glass">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_16rem_at_50%_120%,color-mix(in_oklab,var(--color-iris)_18%,transparent),transparent)]"
              />
              <h2 className="relative text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Your first bucket takes a minute.
              </h2>
              <p className="relative mx-auto mt-3 max-w-md text-[15px] text-ink-soft">
                Start with public repos only. Add private access later if you need it.
              </p>
              <div className="relative mt-8">
                <SignIn />
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
