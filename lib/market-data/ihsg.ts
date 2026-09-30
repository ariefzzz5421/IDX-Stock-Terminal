import "server-only";

export type IhsgQuote = {
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  asOf: string;
  source: "Yahoo Finance";
  delayed: true;
};

/** Yahoo identifies ^JKSE as a delayed Jakarta quote. Never label it live. */
export async function getIhsgQuote(): Promise<IhsgQuote | null> {
  try {
    const response = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE?interval=1m&range=1d",
      { headers: { "User-Agent": "Mozilla/5.0 IDX-Terminal/1.0" }, next: { revalidate: 30 }, signal: AbortSignal.timeout(3_000) },
    );
    if (!response.ok) throw new Error(`Yahoo IHSG returned ${response.status}`);
    const body = (await response.json()) as { chart?: { result?: Array<{ meta?: Record<string, unknown> }> } };
    const meta = body.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const previousClose = meta?.chartPreviousClose;
    const timestamp = meta?.regularMarketTime;
    if (typeof price !== "number" || !Number.isFinite(price) ||
        typeof previousClose !== "number" || !Number.isFinite(previousClose) || previousClose <= 0 ||
        typeof timestamp !== "number" || !Number.isFinite(timestamp)) return null;
    const change = price - previousClose;
    return {
      price,
      previousClose,
      change,
      changePct: change / previousClose * 100,
      asOf: new Date(timestamp * 1000).toISOString(),
      source: "Yahoo Finance",
      delayed: true,
    };
  } catch (error) {
    console.error("[ihsg] delayed quote unavailable:", error);
    return null;
  }
}
