import "server-only";

import { getCompanyCatalogEntry } from "@/lib/company-catalog";

export type FloatStock = {
  code: string;
  name: string;
  floatShares: number;
  outstandingShares: number;
  floatPercent: number;
  lastPrice: number | null;
  marketCap: number | null;
};

export type FloatSnapshot = { rows: FloatStock[]; fetchedAt: string | null; available: boolean };

const CACHE_MS = 5 * 60_000;
const globalCache = globalThis as unknown as {
  floatSnapshot?: { value: FloatSnapshot; expiresAt: number };
  floatPromise?: Promise<FloatSnapshot>;
};

function validNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

async function loadSnapshot(): Promise<FloatSnapshot> {
  try {
    const response = await fetch("https://scanner.tradingview.com/indonesia/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: [{ left: "exchange", operation: "equal", right: "IDX" }],
        markets: ["indonesia"],
        symbols: { query: { types: [] }, tickers: [] },
        columns: ["name", "close", "market_cap_basic", "float_shares_outstanding", "total_shares_outstanding_fundamental"],
        range: [0, 1200],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(7_000),
    });
    if (!response.ok) throw new Error(`TradingView scanner returned ${response.status}`);
    const body = await response.json() as { data?: Array<{ d?: unknown[] }> };
    if (!Array.isArray(body.data)) throw new Error("TradingView scanner returned no data");

    const rows = body.data.flatMap((entry): FloatStock[] => {
      const [rawCode, rawPrice, rawCap, rawFloat, rawOutstanding] = entry.d ?? [];
      if (typeof rawCode !== "string") return [];
      const company = getCompanyCatalogEntry(rawCode);
      const floatShares = validNumber(rawFloat);
      const outstandingShares = validNumber(rawOutstanding);
      if (!company || !floatShares || !outstandingShares || floatShares > outstandingShares) return [];
      const floatPercent = floatShares / outstandingShares * 100;
      if (floatPercent > 100) return [];
      return [{
        code: company.code,
        name: company.name,
        floatShares,
        outstandingShares,
        floatPercent,
        lastPrice: validNumber(rawPrice),
        marketCap: validNumber(rawCap),
      }];
    });
    return { rows, fetchedAt: new Date().toISOString(), available: true };
  } catch (error) {
    console.error("[free-float] TradingView snapshot unavailable:", error);
    return { rows: [], fetchedAt: null, available: false };
  }
}

export async function getFreeFloatSnapshot(): Promise<FloatSnapshot> {
  const cached = globalCache.floatSnapshot;
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  globalCache.floatPromise ??= loadSnapshot().then((value) => {
    globalCache.floatSnapshot = { value, expiresAt: Date.now() + (value.available ? CACHE_MS : 30_000) };
    return value;
  }).finally(() => { globalCache.floatPromise = undefined; });
  return globalCache.floatPromise;
}
