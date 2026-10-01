import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { hotStocks, mostActiveByVolume } from "@/lib/stocks";
import { getMarketActivity } from "@/lib/market-data/trending";
import { snapshotBoards } from "@/lib/market-data/boards";

export const metadata: Metadata = { title: "Hot — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function HotPage() {
  await requireUser();

  const [hot, active, activity] = await Promise.all([hotStocks(20), mostActiveByVolume(15), getMarketActivity()]);
  const snapshot = snapshotBoards(activity);
  const hasSnapshot = activity.allStocks.length > 0;

  return (
    <div className="grid min-h-0 flex-1 gap-px xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <Panel
        title="Hot movers"
        meta={hasSnapshot ? "TradingView delayed · price movers" : "Stored quotes · may be stale"}
      >
        <div className="border-b border-rule bg-panel-hi px-4 py-2.5">
          <p className="max-w-prose text-xs leading-relaxed text-dim">
            Ranked by absolute price change among traded stocks. A large move on
            low volume is not a confirmed catalyst.
          </p>
        </div>
        <StockTable
          rows={hasSnapshot ? snapshot.hot.slice(0, 20) : hot}
          extra="volume"
          rank
          emptyMessage="Belum ada transaksi. Coba lagi saat jam perdagangan."
        />
      </Panel>

      <Panel title="Top volume" meta={hasSnapshot ? "TradingView delayed · by share volume" : "Stored volume · may be stale"}>
        <StockTable
          rows={hasSnapshot ? snapshot.activeByVolume.slice(0, 15) : active}
          extra="volume"
          rank
          emptyMessage="Belum ada volume tercatat."
        />
      </Panel>
    </div>
  );
}
