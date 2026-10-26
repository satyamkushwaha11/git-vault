import Reveal from "./Reveal";
import { CheckIcon, FolderIcon, GlobeIcon, LinkIcon, UploadIcon } from "../icons";

/**
 * Three looping CSS scenes, one per step. Keyframes live in globals.css under
 * "How it works" so they can honour prefers-reduced-motion with everything else.
 */
const STEPS = [
  {
    n: "01",
    title: "Pick a repository",
    body: "Sign in with GitHub and choose any repo you own, or create a fresh one. That repo is now your bucket.",
    scene: (
      <div className="hiw-scene">
        {["portfolio-assets", "blog-images", "client-work"].map((r, i) => (
          <div key={r} className="hiw-row" style={{ animationDelay: `${i * 0.1}s` }}>
            <GlobeIcon className="size-3.5 text-lime" />
            <span>{r}</span>
            {i === 0 && <CheckIcon className="hiw-check ml-auto size-3.5 text-iris-soft" />}
          </div>
        ))}
        <div className="hiw-cursor" />
      </div>
    ),
  },
  {
    n: "02",
    title: "Drop files in",
    body: "Drag anything onto the page. Each upload goes straight from your browser to GitHub as a commit, so there is a full history from day one.",
    scene: (
      <div className="hiw-scene">
        <div className="hiw-folder">
          <FolderIcon className="size-8 text-iris-soft" />
        </div>
        <div className="hiw-file">
          <UploadIcon className="size-3.5" />
          <span>photo.jpg</span>
        </div>
        <div className="hiw-bar">
          <div className="hiw-fill" />
        </div>
        <div className="hiw-commit">
          <CheckIcon className="size-3 text-lime" /> committed 3f9a1c2
        </div>
      </div>
    ),
  },
  {
    n: "03",
    title: "Use the link anywhere",
    body: "Public files get a permanent raw.githubusercontent.com URL. Paste it into your site, your README, your Notion page. It will not expire.",
    scene: (
      <div className="hiw-scene">
        <div className="hiw-url">
          <LinkIcon className="size-3.5 shrink-0 text-ink-faint" />
          <span className="hiw-typed">raw.githubusercontent.com/you/assets/main/photo.jpg</span>
        </div>
        <div className="hiw-copied">
          <CheckIcon className="size-3" /> Copied
        </div>
        <div className="hiw-embed">
          <div className="hiw-embed-img" />
          <div className="hiw-embed-line" />
          <div className="hiw-embed-line short" />
        </div>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto mt-32 max-w-6xl px-6">
      <Reveal className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-iris-soft">How it works</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Three steps. No new accounts, no credit card.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-ink-soft">
          If you have a GitHub account you already have everything git-vault needs.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 110}>
            <article className="group h-full rounded-card p-5 transition-colors duration-300 glass hover:border-line-strong">
              <div className="relative h-44 overflow-hidden rounded-xl border border-line bg-void/60">
                {s.scene}
              </div>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-iris-soft">{s.n}</span>
                <h3 className="text-[15px] font-medium">{s.title}</h3>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">{s.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
