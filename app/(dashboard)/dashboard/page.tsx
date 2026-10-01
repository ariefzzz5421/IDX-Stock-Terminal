import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { ResizableSplit } from "@/components/terminal/ResizableSplit";
import { MarketVolumeTape } from "@/components/terminal/MarketVolumeTape";
import { getMarketActivity } from "@/lib/market-data/trending";
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
      mobileDrawerCount={watchlist.length}
      left={
        <Panel
          title="Watchlist"
          className="h-full"
          headerClassName="pr-12"
          meta={
            <Link href="/watchlist" className="whitespace-nowrap hover:text-amber">
              {watchlist.length} stocks
            </Link>
          }
        >
          <StockTable
            rows={withMarketSnapshot(watchlist, activity)}
            emptyMessage="Belum ada saham pantauan. Cari kode saham, lalu tambahkan dari halaman saham."
          />
        </Panel>
      }
      right={
        <div className="grid min-h-0 h-full gap-px lg:grid-cols-2 xl:pr-8">
          <Panel title="Top gainers" headerClassName="panel-header-gain" meta={hasSnapshot ? "TradingView delayed · change %" : "Stored quotes · may be stale"}>
            <StockTable rows={hasSnapshot ? snapshot.gainers.slice(0, 8) : gainers} rank emptyMessage="Belum ada harga." />
          </Panel>

          <Panel title="Top losers" headerClassName="panel-header-loss" meta={hasSnapshot ? "TradingView delayed · change %" : "Stored quotes · may be stale"}>
            <StockTable rows={hasSnapshot ? snapshot.losers.slice(0, 8) : losers} rank emptyMessage="Belum ada harga." />
          </Panel>

          <Panel
            title="Top volume"
            meta={hasSnapshot ? `${snapshot.activeByVolume.length} stocks · TradingView delayed` : `${counts.quoted} of ${counts.total} stored quotes`}
            className="lg:col-span-2"
          >
            <StockTable
              rows={hasSnapshot ? snapshot.activeByVolume.slice(0, 8) : active}
              extra="volume"
              rank
              emptyMessage="Belum ada volume tercatat."
            />
          </Panel>
        </div>
      }
    />
    </div>
  );
}
