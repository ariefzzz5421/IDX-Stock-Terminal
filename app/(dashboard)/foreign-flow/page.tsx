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
