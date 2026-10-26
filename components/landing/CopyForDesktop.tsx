"use client";

import { useState } from "react";
import { CheckIcon, LinkIcon } from "../icons";

/** Phones from the LinkedIn app can't drag files; let them bring the link to a desktop. */
export default function CopyForDesktop() {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(location.origin);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {}
      }}
      className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-ink-faint underline-offset-4 hover:underline sm:hidden"
    >
      {done ? <CheckIcon className="size-3.5 text-lime" /> : <LinkIcon className="size-3.5" />}
      {done ? "Link copied" : "On a phone? Copy the link for your desktop"}
    </button>
  );
}
