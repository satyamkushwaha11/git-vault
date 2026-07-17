"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertIcon, CheckIcon, XIcon } from "./icons";

type Tone = "ok" | "err";
type Toast = { id: number; tone: Tone; text: string };

const Ctx = createContext<(tone: Tone, text: string) => void>(() => {});

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const push = useCallback((tone: Tone, text: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      tone === "err" ? 6000 : 3200,
    );
  }, []);

  const dismiss = (id: number) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  const value = useMemo(() => push, [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-2.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-scale-in pointer-events-auto flex items-start gap-3 rounded-xl p-3.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.8)] glass"
          >
            <span
              className={`mt-px shrink-0 ${t.tone === "ok" ? "text-lime" : "text-rose"}`}
            >
              {t.tone === "ok" ? (
                <CheckIcon className="size-4" />
              ) : (
                <AlertIcon className="size-4" />
              )}
            </span>
            <p className="flex-1 text-[13px] leading-snug text-ink">{t.text}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="shrink-0 text-ink-faint transition-colors hover:text-ink"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
