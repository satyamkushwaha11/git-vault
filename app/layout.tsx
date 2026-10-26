import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://git-vault.satyamkushwaha.online";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "git-vault — free media storage backed by your GitHub repo",
    template: "%s · git-vault",
  },
  description:
    "Turn any GitHub repository into a media bucket. Drag files in, browse them in a gallery, and get permanent links for your website. Free, open source, nothing stored on our servers.",
  applicationName: "git-vault",
  keywords: ["github", "media storage", "image hosting", "free cdn", "portfolio assets", "open source"],
  openGraph: {
    type: "website",
    siteName: "git-vault",
    title: "git-vault — your media, stored in GitHub",
    description:
      "Free, versioned media storage that is just a GitHub repo you already own. Try the live demo without signing in.",
    url: SITE,
  },
  twitter: {
    card: "summary_large_image",
    title: "git-vault — your media, stored in GitHub",
    description:
      "Free, versioned media storage that is just a GitHub repo you already own.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={inter.variable}
      data-theme="light"
      // The theme script above swaps this attribute before hydration on purpose.
      suppressHydrationWarning
    >
      <head>
        {/*
          Runs before first paint: without it the page would render light and
          then snap to dark on hydration for anyone who picked dark. It also
          carries settings over from the earlier "vault:"/"gitvault:" prefixes,
          so renaming the app doesn't silently reset saved preferences.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{["vault:","gitvault:"].forEach(function(p){Object.keys(localStorage).forEach(function(k){if(k.indexOf(p)===0){var n="git-vault:"+k.slice(p.length);if(localStorage.getItem(n)===null)localStorage.setItem(n,localStorage.getItem(k));localStorage.removeItem(k)}})});var t=localStorage.getItem("git-vault:theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.dataset.theme="dark"}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        <SessionProvider>
          <div className="relative z-10">{children}</div>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
