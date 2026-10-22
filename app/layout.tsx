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

export const metadata: Metadata = {
  title: "git-vault — media storage on GitHub",
  description: "Upload, browse and download media straight from a GitHub repo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} data-theme="light">
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
