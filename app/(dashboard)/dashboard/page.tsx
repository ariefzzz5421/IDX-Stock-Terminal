import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { ResizableSplit } from "@/components/terminal/ResizableSplit";
import {
  boardCounts,
  mostActive,
  refreshBoard,
  topGainers,
  topLosers,
  watchlistRows,
} from "@/lib/stocks";

export const metadata: Metadata = { title: "Dashboard — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  await refreshBoard(user.id);

  const [watchlist, gainers, losers, active, counts] = await Promise.all([
    watchlistRows(user.id),
    topGainers(8),
    topLosers(8),
    mostActive(8),
    boardCounts(),
  ]);

  return (
    <ResizableSplit
      storageKey="dashboard"
      defaultWidth={340}
      leftLabel="watchlist"
      left={
        <Panel
          title="Watchlist"
          className="h-full"
          meta={
            <Link href="/watchlist" className="hover:text-amber">
              {watchlist.length} issues →
            </Link>
          }
        >
          <StockTable
            rows={watchlist}
            emptyMessage="Nothing followed yet. Search a ticker in the command bar and add it from its page."
          />
        </Panel>
      }
      right={
        <div className="grid min-h-0 h-full gap-px lg:grid-cols-2">
          <Panel title="Top gainers" meta="by change %">
            <StockTable rows={gainers} rank emptyMessage="No quotes yet." />
          </Panel>

          <Panel title="Top losers" meta="by change %">
            <StockTable rows={losers} rank emptyMessage="No quotes yet." />
          </Panel>

          <Panel
            title="Most active"
            meta={`${counts.quoted} of ${counts.total} quoted`}
            className="lg:col-span-2"
          >
            <StockTable
              rows={active}
              extra="value"
              rank
              emptyMessage="No turnover recorded yet."
            />
          </Panel>
        </div>
      }
    />
  );
}
