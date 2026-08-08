import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { RemoveFromWatchlist } from "@/components/terminal/RemoveFromWatchlist";
import { refreshBoard, watchlistRows } from "@/lib/stocks";

export const metadata: Metadata = { title: "Watchlist — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const user = await requireUser();
  await refreshBoard(user.id);

  const rows = await watchlistRows(user.id);

  const up = rows.filter((r) => (r.lastChangePct ?? 0) > 0).length;
  const down = rows.filter((r) => (r.lastChangePct ?? 0) < 0).length;

  return (
    <Panel
      title="Watchlist"
      meta={
        <span className="flex items-center gap-3">
          <span>{rows.length} issues</span>
          <span className="text-up">{up} up</span>
          <span className="text-down">{down} down</span>
        </span>
      }
    >
      <StockTable
        rows={rows}
        extra="value"
        emptyMessage="Nothing followed yet. Type a ticker in the command bar, then add it from its page."
        action={(row) => <RemoveFromWatchlist code={row.code} />}
      />
    </Panel>
  );
}
