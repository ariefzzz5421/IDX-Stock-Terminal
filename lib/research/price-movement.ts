import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { getYahooRangeOHLCV } from "@/lib/market-data/yahoo";
import type { ChartCandle } from "@/components/terminal/Chart";

export type ResearchPriceMovement = {
  code: string;
  baselineDate: string;
  baselinePrice: number;
  latestDate: string;
  latestPrice: number;
  changePct: number;
  currency: "IDR" | "USD";
};

function marketDate(time: number, currency: "IDR" | "USD") {
  return new Intl.DateTimeFormat("en-CA", { timeZone: currency === "IDR" ? "Asia/Jakarta" : "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(time);
}

async function getUsCandles(code: string): Promise<ChartCandle[]> {
  if (!/^[A-Z]{1,5}$/.test(code)) return [];
  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${code}?range=1y&interval=1d`, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    next: { revalidate: 3_600 }, signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) return [];
  const body = await response.json() as { chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> } };
  const result = body.chart?.result?.[0];
  return (result?.timestamp ?? []).flatMap((stamp, index) => {
    const close = result?.indicators?.quote?.[0]?.close?.[index];
    return typeof close === "number" && close > 0 ? [{ time: stamp * 1000, open: close, high: close, low: close, close, volume: 0 }] : [];
  });
}

export async function researchPriceMovements(codes: string[], startDate: string) {
  const unique = [...new Set(codes.filter((code) => getCompanyCatalogEntry(code) || ["AMD", "LLY", "GLW", "INTC"].includes(code)))];
  const movements: Array<ResearchPriceMovement | null> = [];
  // Small batches avoid a burst of requests to the delayed, unofficial provider.
  for (let index = 0; index < unique.length; index += 3) {
    const batch = await Promise.all(unique.slice(index, index + 3).map(async (code): Promise<ResearchPriceMovement | null> => {
      try {
        const currency = getCompanyCatalogEntry(code) ? "IDR" : "USD";
        const candles = currency === "IDR" ? await getYahooRangeOHLCV(code, "1Y") : await getUsCandles(code);
        const baseline = candles.find((bar) => marketDate(bar.time, currency) >= startDate);
        const latest = candles.at(-1);
        if (!baseline || !latest || baseline.close <= 0 || latest.time < baseline.time) return null;
        return { code, baselineDate: marketDate(baseline.time, currency), baselinePrice: baseline.close, latestDate: marketDate(latest.time, currency), latestPrice: latest.close, changePct: (latest.close / baseline.close - 1) * 100, currency };
      } catch (error) {
        console.warn(`[research] ${code} historical price unavailable:`, error);
        return null;
      }
    }));
    movements.push(...batch);
  }
  return movements.filter((movement): movement is ResearchPriceMovement => movement !== null);
}
