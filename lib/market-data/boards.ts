import "server-only";

import type { StockRow } from "@/components/terminal/StockTable";
import type { MarketActivity, TrendingStock } from "./trending";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";

function asRow(stock: TrendingStock): StockRow {
  return {
    code: stock.code,
    name: stock.name,
    sector: getCompanyCatalogEntry(stock.code)?.sector ?? null,
    logoUrl: stock.logoUrl,
    lastPrice: stock.lastPrice,
    lastChangePct: stock.changes.day,
    lastVolume: stock.volume,
    lastValue: stock.turnover,
    marketCap: stock.marketCap,
  };
}

/** Merge a dated market snapshot over private watchlist or paginated catalogue rows. */
export function withMarketSnapshot(rows: StockRow[], activity: MarketActivity): StockRow[] {
  if (!activity.allStocks.length) return rows;
  const live = new Map(activity.allStocks.map((stock) => [stock.code, stock]));
  return rows.map((row) => {
    const quote = live.get(row.code);
    return quote ? { ...row, ...asRow(quote), name: row.name, sector: row.sector } : row;
  });
}

export function snapshotBoards(activity: MarketActivity) {
  const rows = activity.allStocks.map(asRow);
  const byTurnover = [...rows].filter((row) => (row.lastValue ?? 0) > 0)
    .sort((a, b) => (b.lastValue ?? 0) - (a.lastValue ?? 0));
  const byChange = rows.filter((row) => row.lastChangePct != null);
  const byVolume = [...rows].filter((row) => (row.lastVolume ?? 0) > 0)
    .sort((a, b) => (b.lastVolume ?? 0) - (a.lastVolume ?? 0));
  return {
    gainers: [...byChange].filter((row) => (row.lastChangePct ?? 0) > 0)
      .sort((a, b) => (b.lastChangePct ?? 0) - (a.lastChangePct ?? 0)),
    losers: [...byChange].filter((row) => (row.lastChangePct ?? 0) < 0)
      .sort((a, b) => (a.lastChangePct ?? 0) - (b.lastChangePct ?? 0)),
    active: byTurnover,
    activeByVolume: byVolume,
    hot: byTurnover.slice(0, 120)
      .sort((a, b) => Math.abs(b.lastChangePct ?? 0) - Math.abs(a.lastChangePct ?? 0)),
  };
}
