import type { Metadata } from "next";
import { ArrowDownToLine, ArrowUpFromLine, Info } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { foreignFlowLeaders } from "@/lib/foreign-flow";
import { Panel } from "@/components/terminal/Panel";
import { ForeignFlowTable } from "@/components/terminal/ForeignFlowTable";

export const metadata: Metadata = { title: "Foreign Flow — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function ForeignFlowPage() {
  await requireUser();
  const flow = await foreignFlowLeaders(10);

  // Two empty tables tell you nothing. When neither source is reachable, say
  // which ones were tried and what would fix it.
  if (!flow.available) {
    return (
      <Panel title="Foreign Flow" meta="source unavailable">
        <div className="max-w-2xl p-6">
          <h2 className="mb-3 text-base text-ink-hi">
            No foreign-flow data source is reachable.
          </h2>
          <p className="mb-5 text-sm leading-relaxed text-dim">
            Net foreign buy and sell are published per trading day, and this
            terminal knows two ways to get them. Neither is available right now:
          </p>

          <dl className="mb-5 border border-rule">
            <div className="border-b border-rule px-4 py-3">
              <dt className="mb-1 text-sm text-ink-hi">IDX official summary</dt>
              <dd className="text-xs leading-relaxed text-dim">
                <span className="text-down">Blocked.</span> idx.co.id sits behind
                Cloudflare and returns <code className="text-cyan">403</code> to
                non-browser clients, so the trading summary cannot be fetched from
                a server.
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="mb-1 text-sm text-ink-hi">Invezgo</dt>
              <dd className="text-xs leading-relaxed text-dim">
                <span className="text-amber">Not configured.</span> Set{" "}
                <code className="text-cyan">INVEZGO_KEY</code> in{" "}
                <code className="text-cyan">.env</code> and restart the dev server
                to enable this panel.
              </dd>
            </div>
          </dl>

          <p className="text-xs leading-relaxed text-dimmer">
            Every other section of the terminal works without this — foreign flow
            is the one feature that has no free, unauthenticated source.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-px">
      <div className="flex flex-wrap items-center gap-3 bg-panel-hi px-4 py-3 text-xs text-dim">
        <Info aria-hidden="true" className="h-4 w-4 text-amber" />
        <p>
          Ranked by net foreign shares (foreign buy minus foreign sell). Estimated
          value multiplies net shares by the closing price; it is not an official cash-flow field.
        </p>
        <span className="ml-auto text-micro uppercase tracking-[0.1em] text-dimmer">
          {flow.date && flow.source
            ? `${flow.source} snapshot ${flow.date}`
            : "Foreign-flow source unavailable"}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 gap-px xl:grid-cols-2">
        <Panel
          title="Top Net Buy Foreign Flow"
          meta={
            <span className="inline-flex items-center gap-1 text-up">
              <ArrowDownToLine aria-hidden="true" className="h-3.5 w-3.5" />
              accumulation
            </span>
          }
        >
          <ForeignFlowTable rows={flow.topBuy} direction="buy" />
        </Panel>

        <Panel
          title="Top Net Sell Foreign Flow"
          meta={
            <span className="inline-flex items-center gap-1 text-down">
              <ArrowUpFromLine aria-hidden="true" className="h-3.5 w-3.5" />
              distribution
            </span>
          }
        >
          <ForeignFlowTable rows={flow.topSell} direction="sell" />
        </Panel>
      </div>
    </div>
  );
}
