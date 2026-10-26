import Reveal from "./Reveal";
import { CheckIcon, GitHubIcon, LockIcon, SparkIcon, XIcon } from "../icons";

const REPO = "https://github.com/satyamkushwaha11/git-vault";

const PILLARS = [
  {
    icon: <LockIcon className="size-5" />,
    title: "Nothing is stored here",
    body: "git-vault has no database and no file storage. Every byte lives in your own GitHub repository, and uploads go from your browser straight to GitHub.",
  },
  {
    icon: <SparkIcon className="size-5" />,
    title: "You hold the keys",
    body: "Your GitHub token sits in an encrypted, HTTP-only session cookie. Revoke the app from your GitHub settings and the session is dead instantly.",
  },
  {
    icon: <GitHubIcon className="size-5" />,
    title: "Every line is public",
    body: "The whole app is open source. Read the code that handles your files, run it yourself, or fork it. No hidden tracking beyond anonymous page counts.",
  },
];

/* What the two sign-in levels actually allow, in words GitHub's consent screen does not use. */
const PERMS: { what: string; pub: boolean; priv: boolean }[] = [
  { what: "See your name, avatar and email to sign you in", pub: true, priv: true },
  { what: "List, read and write files in your public repositories", pub: true, priv: true },
  { what: "List, read and write files in your private repositories", pub: false, priv: true },
  { what: "Create a new repository for you when you ask", pub: true, priv: true },
  { what: "Delete repositories", pub: false, priv: false },
  { what: "Do anything while you are not using the app", pub: false, priv: false },
  { what: "See your password or other GitHub apps", pub: false, priv: false },
];

const Mark = ({ ok }: { ok: boolean }) =>
  ok ? (
    <CheckIcon className="mx-auto size-4 text-lime" />
  ) : (
    <XIcon className="mx-auto size-3.5 text-ink-faint/60" />
  );

export default function Trust() {
  return (
    <section id="security" className="mx-auto mt-32 max-w-6xl px-6">
      <Reveal className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-iris-soft">Security</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Built so you never have to trust us.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-ink-soft">
          Giving an app access to your GitHub account is a big ask. Here is exactly what git-vault can and cannot do with it.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {PILLARS.map((p, i) => (
          <Reveal key={p.title} delay={i * 110}>
            <article className="h-full rounded-card p-5 glass">
              <div className="mb-3.5 inline-flex size-9 items-center justify-center rounded-lg bg-iris/12 text-iris-soft">
                {p.icon}
              </div>
              <h3 className="text-[15px] font-medium">{p.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">{p.body}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200} className="mt-8">
        <div className="overflow-hidden rounded-card glass">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-void/60 text-[11px] uppercase tracking-wider text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-semibold">Permission</th>
                <th className="w-28 px-3 py-3 text-center font-semibold">Public only</th>
                <th className="w-28 px-3 py-3 text-center font-semibold">With private</th>
              </tr>
            </thead>
            <tbody>
              {PERMS.map((r) => (
                <tr key={r.what} className="border-t border-line">
                  <td className="px-5 py-3 text-ink-soft">{r.what}</td>
                  <td className="px-3 py-3"><Mark ok={r.pub} /></td>
                  <td className="px-3 py-3"><Mark ok={r.priv} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col gap-2 border-t border-line bg-void/40 px-5 py-3.5 text-[12px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
            <span>
              Files in private repos are streamed through the app while you view them, and never written to disk.
            </span>
            <span className="flex gap-4">
              <a href="https://github.com/settings/applications" target="_blank" rel="noreferrer" className="text-ink-soft underline-offset-4 hover:underline">
                Revoke access
              </a>
              <a href={`${REPO}/blob/master/auth.ts`} target="_blank" rel="noreferrer" className="text-ink-soft underline-offset-4 hover:underline">
                Read the auth code
              </a>
            </span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
