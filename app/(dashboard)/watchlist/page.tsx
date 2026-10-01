import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { RemoveFromWatchlist } from "@/components/terminal/RemoveFromWatchlist";
import { watchlistRows } from "@/lib/stocks";
import { getMarketActivity } from "@/lib/market-data/trending";
import { withMarketSnapshot } from "@/lib/market-data/boards";

export const metadata: Metadata = { title: "Watchlist — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const user = await requireUser();
  const [storedRows, activity] = await Promise.all([watchlistRows(user.id), getMarketActivity()]);
  const rows = withMarketSnapshot(storedRows, activity);

  const up = rows.filter((r) => (r.lastChangePct ?? 0) > 0).length;
  const down = rows.filter((r) => (r.lastChangePct ?? 0) < 0).length;

  return (
    <Panel
      title="Watchlist"
      meta={
        <span className="flex items-center gap-3">
          <span>{rows.length} stocks</span>
          <span className="text-up">{up} up</span>
          <span className="text-down">{down} down</span>
          <span className="hidden text-dimmer sm:inline">{activity.allStocks.length ? "TradingView delayed" : "Stored quotes · may be stale"}</span>
        </span>
      }
    >
      <StockTable
        rows={rows}
        extra="volume"
        emptyMessage="Belum ada saham pantauan. Cari kode saham, lalu tambahkan dari halaman saham."
        action={(row) => <RemoveFromWatchlist code={row.code} />}
      />
    </Panel>
  );
}
