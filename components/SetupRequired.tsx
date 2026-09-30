import type { MissingSetting } from "@/lib/config";

/**
 * Shown instead of the app when required environment variables are absent.
 * Deliberately reachable without a database or a session.
 */
export function SetupRequired({ missing }: { missing: MissingSetting[] }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-xl border border-amber-dim bg-panel">
        <header className="flex items-baseline gap-3 border-b border-rule bg-panel-hi px-4 py-3">
          <span className="font-display text-base font-bold tracking-[0.16em] text-amber">
            IDX
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-dim">
            Setup required
          </span>
        </header>

        <div className="px-4 py-5">
          <h1 className="mb-2 text-balance text-lg leading-snug text-ink-hi">
            This deployment is missing required configuration.
          </h1>
          <p className="mb-5 text-[12.5px] leading-relaxed text-dim">
            The terminal needs these server-side settings before account and market pages can open. The public preview remains available.
          </p>

          <dl className="mb-5 border border-rule">
            {missing.map((setting) => (
              <div
                key={setting.name}
                className="border-b border-rule px-3 py-2.5 last:border-b-0"
              >
                <dt className="mb-1 text-[12px] font-bold tracking-[0.06em] text-down">
                  {setting.name}
                </dt>
                <dd className="text-[11.5px] leading-relaxed text-dim">
                  {setting.why}
                  <code className="mt-1.5 block break-words border border-rule bg-void px-2 py-1.5 text-[10.5px] text-cyan [overflow-wrap:anywhere]">
                    {setting.how}
                  </code>
                </dd>
              </div>
            ))}
          </dl>

          <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-amber">
            Running locally
          </h2>
          <p className="mb-4 text-[11.5px] leading-relaxed text-dim">
            Development uses embedded SQLite by default. If you run a production build locally, set <Code>SESSION_SECRET</Code> before starting it.
          </p>

          <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-amber">
            Running on a host
          </h2>
          <p className="text-[11.5px] leading-relaxed text-dim">
            Add the settings in Vercel project environment variables and redeploy. Use the Supabase setup guide in the repository for database connection and migration steps.
          </p>
        </div>
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="border border-rule bg-void px-1 py-0.5 text-[10.5px] text-cyan">
      {children}
    </code>
  );
}
