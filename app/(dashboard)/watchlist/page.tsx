import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { RemoveFromWatchlist } from "@/components/terminal/RemoveFromWatchlist";
import { watchlistRows } from "@/lib/stocks";
import { getMarketActivity } from "@/lib/market-data/trending";
import { withMarketSnapshot } from "@/lib/market-data/boards";
import { getUiLanguage, uiCopy } from "@/lib/ui-language";

export const metadata: Metadata = { title: "Watchlist — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const language = await getUiLanguage();
  const copy = uiCopy[language];
  const user = await requireUser();
  const [storedRows, activity] = await Promise.all([watchlistRows(user.id), getMarketActivity()]);
  const rows = withMarketSnapshot(storedRows, activity);

  const up = rows.filter((r) => (r.lastChangePct ?? 0) > 0).length;
  const down = rows.filter((r) => (r.lastChangePct ?? 0) < 0).length;

  return (
    <Panel
      title={language === "id" ? "Pantauan" : "Watchlist"}
      meta={
        <span className="flex items-center gap-3">
          <span>{rows.length} {copy.stocks}</span>
          <span className="text-up">{up} {copy.up}</span>
          <span className="text-down">{down} {copy.down}</span>
          <span className="hidden text-dimmer sm:inline">{activity.allStocks.length ? copy.delayed : copy.stored}</span>
        </span>
      }
    >
      <StockTable
        language={language}
        rows={rows}
        extra="volume"
        emptyMessage={copy.watchlistEmpty}
        action={(row) => <RemoveFromWatchlist code={row.code} />}
      />
    </Panel>
  );
}
