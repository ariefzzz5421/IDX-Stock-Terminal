import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { hotStocks, mostActiveByVolume } from "@/lib/stocks";
import { getMarketActivity } from "@/lib/market-data/trending";
import { snapshotBoards } from "@/lib/market-data/boards";
import { getUiLanguage, uiCopy } from "@/lib/ui-language";

export const metadata: Metadata = { title: "Hot — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function HotPage() {
  const language = await getUiLanguage();
  const copy = uiCopy[language];
  await requireUser();

  const [hot, active, activity] = await Promise.all([hotStocks(20), mostActiveByVolume(15), getMarketActivity()]);
  const snapshot = snapshotBoards(activity);
  const hasSnapshot = activity.allStocks.length > 0;

  return (
    <div className="grid min-h-0 flex-1 gap-px xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <Panel
        title="Hot movers"
        meta={hasSnapshot ? `${copy.delayed} · price movers` : copy.stored}
      >
        <StockTable
          language={language}
          rows={hasSnapshot ? snapshot.hot.slice(0, 20) : hot}
          extra="volume"
          showDailyValue
          rank
          emptyMessage={language === "id" ? "Belum ada transaksi. Coba lagi saat jam perdagangan." : "No trades yet. Try again during market hours."}
        />
      </Panel>

      <Panel title="Top volume" meta={hasSnapshot ? `${copy.delayed} · by share volume` : language === "id" ? "Volume tersimpan · mungkin usang" : "Stored volume · may be stale"}>
        <StockTable
          language={language}
          rows={hasSnapshot ? snapshot.activeByVolume.slice(0, 15) : active}
          extra="volume"
          showDailyValue
          rank
          emptyMessage={copy.noVolume}
        />
      </Panel>
    </div>
  );
}
