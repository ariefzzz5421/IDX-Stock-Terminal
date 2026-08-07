import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IDX Terminal — build status",
};

const MILESTONES = [
  { id: "M1", label: "Project scaffold, Prisma schema, PostgreSQL, seed data", done: true },
  { id: "M2", label: "Auth (register / login) and profile page", done: false },
  { id: "M3", label: "Market data adapter and static watchlist dashboard", done: false },
  { id: "M4", label: "WebSocket relay, live prices and chart", done: false },
  { id: "M5", label: "News aggregation and broadcast", done: false },
  { id: "M6", label: "Pump detector and alert popup", done: false },
  { id: "M7", label: "Bloomberg-style UI polish and command bar", done: false },
  { id: "M8", label: "Documentation and deployment guide", done: false },
];

const REPO_URL = "https://github.com/ariefzzz5421/IDX-Stock-Terminal";

export default function Home() {
  const shipped = MILESTONES.filter((m) => m.done).length;

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl border border-rule-hi bg-panel">
        {/* --- title bar ------------------------------------------------ */}
        <header className="flex items-baseline gap-3 border-b border-rule bg-panel-hi px-4 py-3">
          <span className="font-display text-lg font-bold tracking-[0.16em] text-amber">
            IDX
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-dim">
            Terminal
          </span>
          <span className="ml-auto text-[10px] uppercase tracking-[0.14em] text-dim">
            {shipped} / {MILESTONES.length} shipped
          </span>
        </header>

        <div className="px-4 py-5">
          <h1 className="mb-2 text-balance text-xl leading-snug text-ink-hi">
            A Bloomberg-style terminal for the Indonesia Stock Exchange.
          </h1>
          <p className="mb-6 max-w-prose text-[13px] leading-relaxed text-dim">
            Live watchlist, candlestick charts, curated news and automatic pump
            detection. This deployment is the scaffold — the terminal itself is
            still being built.
          </p>

          {/* --- milestone list ----------------------------------------- */}
          <h2 className="mb-2 border-b border-rule pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-amber">
            Build progress
          </h2>
          <ol className="mb-6">
            {MILESTONES.map((m) => (
              <li
                key={m.id}
                className="flex items-baseline gap-3 border-b border-rule/60 py-1.5 text-[13px]"
              >
                <span
                  aria-hidden="true"
                  className={m.done ? "text-up" : "text-dimmer"}
                >
                  {m.done ? "▰" : "▱"}
                </span>
                <span
                  className={`w-7 shrink-0 tracking-wider ${
                    m.done ? "text-ink-hi" : "text-dim"
                  }`}
                >
                  {m.id}
                </span>
                <span className={m.done ? "text-ink" : "text-dim"}>
                  {m.label}
                </span>
                <span className="ml-auto shrink-0 pl-3 text-[10px] uppercase tracking-[0.12em] text-dimmer">
                  {m.done ? "done" : "pending"}
                </span>
              </li>
            ))}
          </ol>

          <a
            href={REPO_URL}
            className="inline-block border border-amber-dim px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-amber transition-colors hover:bg-amber hover:text-void"
          >
            Source on GitHub →
          </a>
        </div>

        {/* --- status bar ----------------------------------------------- */}
        <footer className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-rule bg-panel-hi px-4 py-2 text-[10px] uppercase tracking-[0.1em] text-dim">
          <span>
            Build <span className="text-ink">scaffold</span>
          </span>
          <span>
            Data <span className="text-ink">not connected</span>
          </span>
          <span className="ml-auto">MIT licensed</span>
        </footer>
      </div>
    </main>
  );
}
