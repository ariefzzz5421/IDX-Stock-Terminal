"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-lg border border-down/40 bg-panel">
        <header className="flex items-baseline gap-3 border-b border-rule bg-panel-hi px-4 py-3">
          <span className="font-display text-base font-bold tracking-[0.16em] text-down">
            IDX
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-dim">
            Something broke
          </span>
        </header>

        <div className="px-4 py-5">
          <p className="mb-4 text-[13px] leading-relaxed text-ink">
            An unexpected error stopped this page from rendering. The details
            are in your terminal and the browser console.
          </p>

          <details className="mb-5">
            <summary className="cursor-pointer text-[10px] uppercase tracking-[0.12em] text-dim hover:text-ink">
              Error detail
            </summary>
            <pre className="mt-2 overflow-x-auto border border-rule bg-void p-3 text-[11px] leading-relaxed text-down">
              {error.message}
            </pre>
          </details>

          <button
            type="button"
            onClick={reset}
            className="bg-amber px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-void transition-colors hover:bg-ink-hi"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
