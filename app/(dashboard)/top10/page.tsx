import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { mostActive, topGainers, topLosers } from "@/lib/stocks";
import { getMarketActivity } from "@/lib/market-data/trending";
import { snapshotBoards } from "@/lib/market-data/boards";

export const metadata: Metadata = { title: "Top 10 — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function TopTenPage() {
  await requireUser();

  const [gainers, losers, active, activity] = await Promise.all([
    topGainers(10),
    topLosers(10),
    mostActive(10),
    getMarketActivity(),
  ]);
  const snapshot = snapshotBoards(activity);
  const hasSnapshot = activity.allStocks.length > 0;

  return (
    <div className="grid min-h-0 flex-1 gap-px lg:grid-cols-2">
      <Panel title="Top 10 gainers" meta={hasSnapshot ? "TradingView delayed · change %" : "Stored quotes · may be stale"}>
        <StockTable rows={hasSnapshot ? snapshot.gainers.slice(0, 10) : gainers} rank emptyMessage="No quotes yet." />
      </Panel>

      <Panel title="Top 10 losers" meta={hasSnapshot ? "TradingView delayed · change %" : "Stored quotes · may be stale"}>
        <StockTable rows={hasSnapshot ? snapshot.losers.slice(0, 10) : losers} rank emptyMessage="No quotes yet." />
      </Panel>

      <Panel
        title="Top 10 by turnover"
        meta={hasSnapshot ? "TradingView delayed · rupiah traded" : "Stored turnover · may be stale"}
        className="lg:col-span-2"
      >
        <StockTable
          rows={hasSnapshot ? snapshot.active.slice(0, 10) : active}
          extra="value"
          rank
          emptyMessage="No turnover recorded yet."
        />
      </Panel>
    </div>
  );
}
