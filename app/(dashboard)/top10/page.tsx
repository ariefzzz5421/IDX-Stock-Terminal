import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { mostActiveByVolume, topGainers, topLosers } from "@/lib/stocks";
import { getMarketActivity } from "@/lib/market-data/trending";
import { snapshotBoards } from "@/lib/market-data/boards";

export const metadata: Metadata = { title: "Top 10 — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function TopTenPage() {
  await requireUser();

  const [gainers, losers, active, activity] = await Promise.all([
    topGainers(10),
    topLosers(10),
    mostActiveByVolume(10),
    getMarketActivity(),
  ]);
  const snapshot = snapshotBoards(activity);
  const hasSnapshot = activity.allStocks.length > 0;

  return (
    <div className="grid min-h-0 flex-1 gap-px lg:grid-cols-2">
      <Panel title="10 kenaikan terbesar" meta={hasSnapshot ? "TradingView tertunda · perubahan %" : "Harga tersimpan · mungkin usang"}>
        <StockTable rows={hasSnapshot ? snapshot.gainers.slice(0, 10) : gainers} rank emptyMessage="Belum ada harga." />
      </Panel>

      <Panel title="10 penurunan terbesar" meta={hasSnapshot ? "TradingView tertunda · perubahan %" : "Harga tersimpan · mungkin usang"}>
        <StockTable rows={hasSnapshot ? snapshot.losers.slice(0, 10) : losers} rank emptyMessage="Belum ada harga." />
      </Panel>

      <Panel
        title="10 volume tertinggi"
        meta={hasSnapshot ? "TradingView tertunda · jumlah saham" : "Volume tersimpan · mungkin usang"}
        className="lg:col-span-2"
      >
        <StockTable
          rows={hasSnapshot ? snapshot.activeByVolume.slice(0, 10) : active}
          extra="volume"
          rank
          emptyMessage="Belum ada volume tercatat."
        />
      </Panel>
    </div>
  );
}
