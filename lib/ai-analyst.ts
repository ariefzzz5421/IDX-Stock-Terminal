import "server-only";

import type { MarketActivity, TrendingStock } from "@/lib/market-data/trending";
import { formatPct, formatPrice, formatVolume } from "@/lib/format";

export type AnalystFact = { code: string; price: string; change: string; volume: string };
export type MarketBrief = {
  asOf: string | null;
  sourceUrl: string;
  universeCount: number;
  summary: string;
  gainers: AnalystFact[];
  losers: AnalystFact[];
  volumeLeaders: AnalystFact[];
  hot: AnalystFact[];
};

function fact(stock: TrendingStock): AnalystFact {
  return {
    code: stock.code,
    price: formatPrice(stock.lastPrice),
    change: formatPct(stock.changes.day),
    volume: formatVolume(stock.volume),
  };
}

export function createMarketBrief(activity: MarketActivity): MarketBrief {
  const quoted = activity.allStocks.filter((stock) => stock.changes.day !== null && stock.volume > 0);
  const gainers = [...quoted].filter((stock) => (stock.changes.day ?? 0) > 0).sort((a, b) => (b.changes.day ?? 0) - (a.changes.day ?? 0));
  const losers = [...quoted].filter((stock) => (stock.changes.day ?? 0) < 0).sort((a, b) => (a.changes.day ?? 0) - (b.changes.day ?? 0));
  const hot = [...quoted].sort((a, b) => Math.abs(b.changes.day ?? 0) - Math.abs(a.changes.day ?? 0));
  const leader = activity.byVolume[0];
  const summary = activity.fetchedAt
    ? `Snapshot tertunda mencakup ${activity.allStocks.length} saham BEI. ${leader ? `Volume terbesar pada snapshot ini: ${leader.code} (${formatVolume(leader.volume)} saham).` : "Peringkat volume belum tersedia."} Perubahan harga dan volume dapat berubah pada sesi berikutnya.`
    : "Feed pasar belum dapat dijangkau. Ringkasan pergerakan belum tersedia; tidak ada angka perkiraan yang ditampilkan.";

  return {
    asOf: activity.fetchedAt,
    sourceUrl: "https://www.tradingview.com/markets/stocks-indonesia/market-movers-active/",
    universeCount: activity.allStocks.length,
    summary,
    gainers: gainers.slice(0, 5).map(fact),
    losers: losers.slice(0, 5).map(fact),
    volumeLeaders: activity.byVolume.slice(0, 10).map(fact),
    hot: hot.slice(0, 5).map(fact),
  };
}

export type AnalystProvider = { summarize(brief: MarketBrief): Promise<string> };

/** No key or endpoint is shipped to the browser. An OpenAI-compatible adapter can be enabled later. */
export function getAnalystProvider(): AnalystProvider | null {
  const key = process.env.AI_ANALYST_API_KEY;
  const model = process.env.AI_ANALYST_MODEL;
  const base = process.env.AI_ANALYST_BASE_URL;
  if (!key || !model || !base) return null;
  let url: URL;
  try { url = new URL(`${base.replace(/\/$/, "")}/chat/completions`); } catch { return null; }
  if (url.protocol !== "https:") return null;

  return {
    async summarize(brief) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: 450,
          messages: [
            { role: "system", content: "Write a concise Indonesian market summary from ONLY the supplied dated market snapshot. Distinguish price movement from causes: no news, catalysts, contracts, or explanations are provided, so never invent them. No buy/sell advice. State that the feed is delayed and include the source URL." },
            { role: "user", content: JSON.stringify(brief) },
          ],
        }),
        signal: AbortSignal.timeout(12_000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
      const data = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) throw new Error("AI provider returned no text");
      return content.trim().slice(0, 2_000);
    },
  };
}
