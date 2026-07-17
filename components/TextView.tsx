"use client";

import { useEffect, useState } from "react";
import type { Item } from "./types";

const LIMIT = 512 * 1024;

/** Renders any text-ish file: source, JSON, markdown, CSV, logs. */
export default function TextView({ item }: { item: Item }) {
  const [text, setText] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!item.url) return;
    let alive = true;
    setText(null);
    setErr(null);

    (async () => {
      try {
        const res = await fetch(item.url!);
        if (!res.ok) throw new Error(`Couldn't fetch (${res.status})`);
        const raw = await res.text();
        if (!alive) return;
        setText(
          raw.length > LIMIT
            ? raw.slice(0, LIMIT) + "\n\n… truncated — download to see the rest."
            : raw,
        );
      } catch (e) {
        if (alive) setErr((e as Error).message);
      }
    })();

    return () => {
      alive = false;
    };
  }, [item.url]);

  if (item.size > LIMIT * 8)
    return (
      <Shell>
        <p className="text-sm text-ink-soft">
          This file is too large to preview.
        </p>
      </Shell>
    );

  if (err)
    return (
      <Shell>
        <p className="text-sm text-rose">{err}</p>
      </Shell>
    );

  if (text === null)
    return (
      <Shell>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-3 rounded skeleton" />
          ))}
        </div>
      </Shell>
    );

  const lines = text.split("\n");

  return (
    <div className="h-[calc(100dvh-9rem)] w-[min(64rem,92vw)] overflow-auto rounded-card border border-line bg-base/80 backdrop-blur-xl">
      <pre className="min-w-full p-4 font-mono text-[12px] leading-[1.65]">
        <code>
          {lines.map((line, i) => (
            <div key={i} className="flex hover:bg-hover">
              <span className="sticky left-0 mr-4 w-10 shrink-0 select-none bg-base/80 text-right text-ink-faint/60">
                {i + 1}
              </span>
              <span className="whitespace-pre-wrap break-words text-ink-soft">
                {line || " "}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[min(40rem,90vw)] rounded-card p-6 glass">{children}</div>
  );
}
