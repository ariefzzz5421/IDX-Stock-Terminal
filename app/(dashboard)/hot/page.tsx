import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { hotStocks, mostActiveByVolume } from "@/lib/stocks";
import { getMarketActivity } from "@/lib/market-data/trending";
import { snapshotBoards } from "@/lib/market-data/boards";

export const metadata: Metadata = { title: "Saham Aktif — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function HotPage() {
  await requireUser();

  const [hot, active, activity] = await Promise.all([hotStocks(20), mostActiveByVolume(15), getMarketActivity()]);
  const snapshot = snapshotBoards(activity);
  const hasSnapshot = activity.allStocks.length > 0;

  return (
    <div className="grid min-h-0 flex-1 gap-px xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <Panel
        title="Pergerakan aktif"
        meta={hasSnapshot ? "TradingView tertunda · pergerakan harga" : "Harga tersimpan · mungkin usang"}
      >
        <div className="border-b border-rule bg-panel-hi px-4 py-2.5">
          <p className="max-w-prose text-xs leading-relaxed text-dim">
            Peringkat menurut besarnya perubahan harga, hanya untuk saham dengan
            transaksi tercatat. Kenaikan tinggi pada sedikit lot belum tentu sinyal kuat.
          </p>
        </div>
        <StockTable
          rows={hasSnapshot ? snapshot.hot.slice(0, 20) : hot}
          extra="volume"
          rank
          emptyMessage="Belum ada transaksi. Coba lagi saat jam perdagangan."
        />
      </Panel>

      <Panel title="Volume tertinggi" meta={hasSnapshot ? "TradingView tertunda · berdasarkan volume" : "Volume tersimpan · mungkin usang"}>
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
