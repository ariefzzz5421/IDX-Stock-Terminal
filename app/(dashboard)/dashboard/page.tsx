import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { ResizableSplit } from "@/components/terminal/ResizableSplit";
import { MarketVolumeTape } from "@/components/terminal/MarketVolumeTape";
import { getMarketActivity } from "@/lib/market-data/trending";
import { getUiLanguage, uiCopy } from "@/lib/ui-language";
import { snapshotBoards, withMarketSnapshot } from "@/lib/market-data/boards";
import {
  boardCounts,
  mostActiveByVolume,
  topGainers,
  topLosers,
  watchlistRows,
} from "@/lib/stocks";

export const metadata: Metadata = { title: "Dashboard — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const language = await getUiLanguage();
  const copy = uiCopy[language];
  const user = await requireUser();
  const [watchlist, gainers, losers, active, counts, activity] = await Promise.all([
    watchlistRows(user.id),
    topGainers(8),
    topLosers(8),
    mostActiveByVolume(8),
    boardCounts(),
    getMarketActivity(),
  ]);
  const snapshot = snapshotBoards(activity);
  const hasSnapshot = activity.allStocks.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
    <MarketVolumeTape stocks={activity.byVolume} />
    <ResizableSplit
      storageKey="dashboard"
      defaultWidth={340}
      leftLabel="watchlist"
      collapseButtonPlacement="panel"
      hideLeftOnPhone
      left={
        <Panel
          title={language === "id" ? "Pantauan" : "Watchlist"}
          className="h-full"
          headerClassName="pr-12"
          meta={
            <Link href="/watchlist" className="whitespace-nowrap hover:text-amber">
              {watchlist.length} {copy.stocks}
            </Link>
          }
        >
          <StockTable
            language={language}
            rows={withMarketSnapshot(watchlist, activity)}
            emptyMessage={copy.watchlistEmpty}
          />
        </Panel>
      }
      right={
        <div className="grid min-h-0 h-full gap-px lg:grid-cols-2 xl:pr-8">
          <Panel title="Top gainers" headerClassName="panel-header-gain" meta={hasSnapshot ? `${copy.delayed} · change %` : copy.stored}>
            <StockTable language={language} rows={hasSnapshot ? snapshot.gainers.slice(0, 8) : gainers} rank showDailyValue emptyMessage={copy.noPrice} />
          </Panel>

          <Panel title="Top losers" headerClassName="panel-header-loss" meta={hasSnapshot ? `${copy.delayed} · change %` : copy.stored}>
            <StockTable language={language} rows={hasSnapshot ? snapshot.losers.slice(0, 8) : losers} rank showDailyValue emptyMessage={copy.noPrice} />
          </Panel>

          <Panel
            title="Top volume"
            meta={hasSnapshot ? `${snapshot.activeByVolume.length} ${copy.stocks} · TradingView · volume & nilai transaksi harian` : language === "id" ? `${counts.quoted} dari ${counts.total} harga tersimpan` : `${counts.quoted} of ${counts.total} stored quotes`}
            className="lg:col-span-2"
          >
            <>
            <StockTable
              language={language}
              rows={hasSnapshot ? snapshot.activeByVolume.slice(0, 8) : active}
              extra="volume"
              showDailyValue
              rank
              emptyMessage={copy.noVolume}
            />
            <p className="border-t border-rule px-3 py-2 text-micro text-dim">{hasSnapshot ? "Est. nilai transaksi harian dalam rupiah mengikuti Value.Traded dari snapshot TradingView." : "Est. nilai transaksi memakai data harga tersimpan; snapshot pasar saat ini tidak tersedia."} Angka yang tidak tersedia ditampilkan —.</p>
            </>
          </Panel>
        </div>
      }
    />
    </div>
  );
}
