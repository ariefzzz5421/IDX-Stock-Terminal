import "server-only";

import { getCompanyCatalogEntry } from "@/lib/company-catalog";

export type TrendingStock = {
  code: string;
  name: string;
  logoUrl: string | null;
  lastPrice: number | null;
  turnover: number;
  changes: { day: number | null; week: number | null; month: number | null };
};

const COLUMNS = ["name", "close", "change", "Perf.W", "Perf.1M", "Value.Traded"];

/** A single delayed market snapshot, sorted by traded rupiah rather than a made-up trend score. */
export async function getTrendingStocks(): Promise<TrendingStock[]> {
  try {
    const response = await fetch("https://scanner.tradingview.com/indonesia/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: [{ left: "exchange", operation: "equal", right: "IDX" }],
        markets: ["indonesia"],
        symbols: { query: { types: [] }, tickers: [] },
        columns: COLUMNS,
        sort: { sortBy: "Value.Traded", sortOrder: "desc" },
        range: [0, 49],
      }),
      next: { revalidate: 120 },
    });
    if (!response.ok) throw new Error(`Scanner returned ${response.status}`);
    const body = (await response.json()) as { data?: Array<{ d?: unknown[] }> };
    const stocks = (body.data ?? []).flatMap((row): TrendingStock[] => {
      const [rawCode, rawPrice, rawDay, rawWeek, rawMonth, rawTurnover] = row.d ?? [];
      if (typeof rawCode !== "string" || typeof rawTurnover !== "number" || rawTurnover <= 0) return [];
      const company = getCompanyCatalogEntry(rawCode);
      if (!company) return [];
      const metric = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
      return [{
        code: company.code,
        name: company.name,
        logoUrl: company.logoUrl,
        lastPrice: metric(rawPrice),
        turnover: rawTurnover,
        changes: { day: metric(rawDay), week: metric(rawWeek), month: metric(rawMonth) },
      }];
    });
    return stocks.slice(0, 10);
  } catch (error) {
    console.error("[trending] delayed market snapshot unavailable:", error);
    return [];
  }
}
