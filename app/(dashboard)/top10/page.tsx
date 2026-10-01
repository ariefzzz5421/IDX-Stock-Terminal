import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { mostActiveByVolume, topGainers, topLosers } from "@/lib/stocks";
import { getMarketActivity } from "@/lib/market-data/trending";
import { snapshotBoards } from "@/lib/market-data/boards";
import { getUiLanguage, uiCopy } from "@/lib/ui-language";

export const metadata: Metadata = { title: "Top 10 — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function TopTenPage() {
  const language = await getUiLanguage();
  const copy = uiCopy[language];
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
      <Panel title="Top 10 gainers" headerClassName="panel-header-gain" meta={hasSnapshot ? `${copy.delayed} · change %` : copy.stored}>
        <StockTable language={language} rows={hasSnapshot ? snapshot.gainers.slice(0, 10) : gainers} rank emptyMessage={copy.noPrice} />
      </Panel>

      <Panel title="Top 10 losers" headerClassName="panel-header-loss" meta={hasSnapshot ? `${copy.delayed} · change %` : copy.stored}>
        <StockTable language={language} rows={hasSnapshot ? snapshot.losers.slice(0, 10) : losers} rank emptyMessage={copy.noPrice} />
      </Panel>

      <Panel
        title="Top 10 volume"
        meta={hasSnapshot ? `${copy.delayed} · share volume` : language === "id" ? "Volume tersimpan · mungkin usang" : "Stored volume · may be stale"}
        className="lg:col-span-2"
      >
        <StockTable
          language={language}
          rows={hasSnapshot ? snapshot.activeByVolume.slice(0, 10) : active}
          extra="volume"
          rank
          emptyMessage={copy.noVolume}
        />
      </Panel>
    </div>
  );
}
