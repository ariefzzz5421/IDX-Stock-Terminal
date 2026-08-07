"use client";

import { useEffect } from "react";

/**
 * The overwhelmingly likely first-run failure is "Postgres isn't set up yet",
 * so detect that shape and answer it directly instead of showing a stack trace.
 */
function isDatabaseError(message: string): boolean {
  return (
    /ECONNREFUSED|ENOTFOUND|does not exist|DATABASE_URL|password authentication|Can't reach database|relation .* does not exist/i.test(
      message,
    )
  );
}

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

  const dbProblem = isDatabaseError(error.message);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-lg border border-down/40 bg-panel">
        <header className="flex items-baseline gap-3 border-b border-rule bg-panel-hi px-4 py-3">
          <span className="font-display text-base font-bold tracking-[0.16em] text-down">
            IDX
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-dim">
            {dbProblem ? "Database not ready" : "Something broke"}
          </span>
        </header>

        <div className="px-4 py-5">
          {dbProblem ? (
            <>
              <p className="mb-4 text-[13px] leading-relaxed text-ink">
                The terminal cannot reach your PostgreSQL database. If this is a
                fresh clone, finish the setup:
              </p>
              <ol className="mb-4 space-y-2 text-[12px] leading-relaxed text-dim">
                <Step n={1}>
                  Start Postgres — <Code>docker compose up -d</Code>, or run{" "}
                  <Code>scripts/setup-db.sql</Code> against your own install.
                </Step>
                <Step n={2}>
                  Copy <Code>.env.example</Code> to <Code>.env</Code> and set{" "}
                  <Code>DATABASE_URL</Code> and <Code>SESSION_SECRET</Code>.
                </Step>
                <Step n={3}>
                  Create the tables — <Code>npm run db:migrate</Code>.
                </Step>
                <Step n={4}>
                  Load the IDX tickers — <Code>npm run db:seed</Code>.
                </Step>
              </ol>
            </>
          ) : (
            <p className="mb-4 text-[13px] leading-relaxed text-ink">
              An unexpected error stopped this page from rendering. The details
              are in your terminal and the browser console.
            </p>
          )}

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

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="shrink-0 text-amber">{n}.</span>
      <span>{children}</span>
    </li>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="border border-rule bg-void px-1 py-0.5 text-[11px] text-cyan">
      {children}
    </code>
  );
}
