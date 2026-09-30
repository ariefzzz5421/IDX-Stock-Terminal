import "server-only";

import { cache } from "react";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";

export type MarketCapFilter = "all" | "gt100t" | "gt50t" | "gt10t" | "gt1t" | "under1t";

export type TrendingStock = {
  code: string;
  name: string;
  logoUrl: string | null;
  lastPrice: number | null;
  turnover: number;
  volume: number;
  marketCap: number | null;
  changes: { day: number | null; week: number | null; month: number | null };
};

export type MarketActivity = {
  byMarketCap: Record<MarketCapFilter, TrendingStock[]>;
  byVolume: TrendingStock[];
  fetchedAt: string | null;
};

const COLUMNS = ["name", "close", "change", "Perf.W", "Perf.1M", "Value.Traded", "volume", "market_cap_basic"];
function belongs(stock: TrendingStock, filter: MarketCapFilter) {
  const cap = stock.marketCap;
  if (filter === "all") return true;
  if (cap === null) return false;
  if (filter === "gt100t") return cap > 100e12;
  if (filter === "gt50t") return cap > 50e12;
  if (filter === "gt10t") return cap > 10e12;
  if (filter === "gt1t") return cap > 1e12;
  return cap < 1e12;
}

function unavailable(): MarketActivity {
  return {
    byMarketCap: { all: [], gt100t: [], gt50t: [], gt10t: [], gt1t: [], under1t: [] },
    byVolume: [],
    fetchedAt: null,
  };
}

/** Delayed scanner snapshot. The same request serves the popup and the volume tape. */
export const getMarketActivity = cache(async (): Promise<MarketActivity> => {
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
        range: [0, 999],
      }),
      next: { revalidate: 90 },
    });
    if (!response.ok) throw new Error(`Scanner returned ${response.status}`);
    const body = (await response.json()) as { data?: Array<{ d?: unknown[] }> };
    const metric = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
    const stocks = (body.data ?? []).flatMap((row): TrendingStock[] => {
      const [rawCode, rawPrice, rawDay, rawWeek, rawMonth, rawTurnover, rawVolume, rawCap] = row.d ?? [];
      if (typeof rawCode !== "string") return [];
      const company = getCompanyCatalogEntry(rawCode);
      if (!company) return [];
      const turnover = metric(rawTurnover) ?? 0;
      const volume = metric(rawVolume) ?? 0;
      if (turnover <= 0 && volume <= 0) return [];
      const cap = metric(rawCap);
      return [{
        code: company.code,
        name: company.name,
        logoUrl: company.logoUrl,
        lastPrice: metric(rawPrice),
        turnover,
        volume,
        marketCap: cap && cap > 0 ? cap : company.marketCap,
        changes: { day: metric(rawDay), week: metric(rawWeek), month: metric(rawMonth) },
      }];
    });
    const byMarketCap: MarketActivity["byMarketCap"] = {
      all: stocks.filter((stock) => belongs(stock, "all")).slice(0, 10),
      gt100t: stocks.filter((stock) => belongs(stock, "gt100t")).slice(0, 10),
      gt50t: stocks.filter((stock) => belongs(stock, "gt50t")).slice(0, 10),
      gt10t: stocks.filter((stock) => belongs(stock, "gt10t")).slice(0, 10),
      gt1t: stocks.filter((stock) => belongs(stock, "gt1t")).slice(0, 10),
      under1t: stocks.filter((stock) => belongs(stock, "under1t")).slice(0, 10),
    };
    const byVolume = [...stocks].filter((stock) => stock.volume > 0)
      .sort((a, b) => b.volume - a.volume || b.turnover - a.turnover)
      .slice(0, 10);
    return { byMarketCap, byVolume, fetchedAt: new Date().toISOString() };
  } catch (error) {
    console.error("[trending] delayed market snapshot unavailable:", error);
    return unavailable();
  }
});

export async function getTrendingStocks() {
  return (await getMarketActivity()).byMarketCap.all;
}
