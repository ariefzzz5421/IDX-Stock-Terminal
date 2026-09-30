import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { hotStocks, mostActive } from "@/lib/stocks";
import { getMarketActivity } from "@/lib/market-data/trending";
import { snapshotBoards } from "@/lib/market-data/boards";

export const metadata: Metadata = { title: "Hot — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function HotPage() {
  await requireUser();

  const [hot, active, activity] = await Promise.all([hotStocks(20), mostActive(15), getMarketActivity()]);
  const snapshot = snapshotBoards(activity);
  const hasSnapshot = activity.allStocks.length > 0;

  return (
    <div className="grid min-h-0 flex-1 gap-px xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <Panel
        title="Hot"
        meta={hasSnapshot ? "TradingView delayed · active movers" : "Stored quotes · may be stale"}
      >
        <div className="border-b border-rule bg-panel-hi px-4 py-2.5">
          <p className="max-w-prose text-xs leading-relaxed text-dim">
            Ranked by absolute move, but only across names with real turnover —
            a 20% jump on a handful of lots is noise, not a signal. Live pump
            detection with alerts arrives in Milestone 6.
          </p>
        </div>
        <StockTable
          rows={hasSnapshot ? snapshot.hot.slice(0, 20) : hot}
          extra="value"
          rank
          emptyMessage="Nothing trading yet. Come back during market hours."
        />
      </Panel>

      <Panel title="Most active" meta={hasSnapshot ? "TradingView delayed · by turnover" : "Stored turnover · may be stale"}>
        <StockTable
          rows={hasSnapshot ? snapshot.active.slice(0, 15) : active}
          extra="value"
          rank
          emptyMessage="No turnover recorded yet."
        />
      </Panel>
    </div>
  );
}
