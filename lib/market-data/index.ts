import "server-only";

import type { Candle, Interval, MarketDataProvider, Quote, QuoteListener, Unsubscribe } from "./types";
import { MockProvider } from "./mock";
import { YahooProvider } from "./yahoo";
import { GoApiProvider } from "./goapi";
import { ItickProvider } from "./itick";
import { InvezgoProvider } from "./invezgo";
import { UnavailableProvider } from "./unavailable";
import { pollingSubscription } from "./polling";
import { validateQuote } from "./reliability";

export type { Candle, Interval, MarketDataProvider, Quote } from "./types";
export { snapToTick, tickSize, INTERVAL_MS } from "./types";

const PROVIDERS = {
  yahoo: YahooProvider,
  mock: MockProvider,
  goapi: GoApiProvider,
  itick: ItickProvider,
  invezgo: InvezgoProvider,
} as const;

export type ProviderName = keyof typeof PROVIDERS;

/**
 * Ordered failover is opt-in and only retries missing/invalid quotes.
 * No multi-account key rotation or synthetic prices in production.
 */
class RoutedProvider implements MarketDataProvider {
  readonly name: string;
  readonly ready: boolean;

  constructor(private readonly providers: MarketDataProvider[]) {
    this.name = providers.length > 1 ? "hybrid" : (providers[0]?.name ?? "unavailable");
    this.ready = providers.length > 0;
  }

  private annotate(raw: Quote | null, code: string, provider: MarketDataProvider): Quote | null {
    if (!raw) return null;
    const quote: Quote = {
      ...raw,
      code: raw.code.toUpperCase(),
      source: provider.name,
      // A fetch timestamp is not proof of when a trade occurred.
      timestampVerified: raw.timestampVerified === true,
    };
    if (!validateQuote(quote, code)) {
      console.warn(`[market-data] rejected invalid quote from ${provider.name} for ${code}`);
      return null;
    }
    return quote;
  }

  async getQuote(code: string): Promise<Quote | null> {
    const symbol = code.toUpperCase();
    for (const provider of this.providers) {
      try {
        const quote = this.annotate(await provider.getQuote(symbol), symbol, provider);
        if (quote) return quote;
      } catch (error) {
        console.warn(`[market-data] ${provider.name} failed for ${symbol}:`, error);
      }
    }
    return null;
  }

  async getQuotes(codes: string[]): Promise<Quote[]> {
    const needed = new Set(codes.map((code) => code.toUpperCase()));
    const byCode = new Map<string, Quote>();
    for (const provider of this.providers) {
      if (!needed.size) break;
      try {
        const batch = await provider.getQuotes([...needed]);
        for (const raw of batch) {
          if (!needed.has(raw.code.toUpperCase())) continue;
          const quote = this.annotate(raw, raw.code.toUpperCase(), provider);
          if (!quote) continue;
          byCode.set(quote.code, quote);
          needed.delete(quote.code);
        }
      } catch (error) {
        console.warn(`[market-data] ${provider.name} batch failed:`, error);
      }
    }
    return [...byCode.values()];
  }

  async getOHLCV(code: string, interval: Interval, limit = 120): Promise<Candle[]> {
    for (const provider of this.providers) {
      try {
        const candles = await provider.getOHLCV(code, interval, limit);
        // Avoid rendering corrupt/zero-price candles. This is not cross-source confirmation.
        if (candles.length && candles.every((bar) =>
          Number.isFinite(bar.time) && Number.isFinite(bar.open) &&
          Number.isFinite(bar.high) && Number.isFinite(bar.low) &&
          Number.isFinite(bar.close) && Number.isFinite(bar.volume) &&
          bar.open > 0 && bar.low > 0 && bar.high >= bar.low &&
          bar.close > 0 && bar.volume >= 0
        )) return candles;
      } catch (error) {
        console.warn(`[market-data] ${provider.name} candles failed for ${code}:`, error);
      }
    }
    return [];
  }

  subscribeLive(codes: string[], onQuote: QuoteListener): Unsubscribe {
    // Keep native streaming for single-provider connections; use the shared
    // polling adapter when failover is configured to keep routing consistent.
    if (this.providers.length === 1) {
      const provider = this.providers[0];
      return provider.subscribeLive(codes, (raw) => {
        const quote = this.annotate(raw, raw.code.toUpperCase(), provider);
        if (quote) onQuote(quote);
      });
    }
    return pollingSubscription(this, codes, onQuote);
  }
}

function build(): MarketDataProvider {
  const primaryName = (process.env.MARKET_DATA_PROVIDER ?? "yahoo").trim().toLowerCase();
  const configuredFallbacks = (process.env.MARKET_DATA_FALLBACKS ?? "")
    .split(",").map((name) => name.trim().toLowerCase()).filter(Boolean);
  const names = [...new Set([primaryName, ...configuredFallbacks])];
  const selected: MarketDataProvider[] = [];

  for (const name of names) {
    if (!(name in PROVIDERS)) {
      console.warn(`[market-data] Unknown provider "${name}"; skipping.`);
      continue;
    }
    if (name === "mock" && (process.env.NODE_ENV === "production" || name !== primaryName)) {
      console.warn("[market-data] Mock quotes are forbidden as production/fallback market data.");
      continue;
    }
    const Provider = PROVIDERS[name as ProviderName];
    const provider = new Provider();
    if (!provider.ready) {
      console.warn(`[market-data] Provider "${name}" missing credentials; skipping (no synthetic fallback).`);
      continue;
    }
    selected.push(provider);
  }

  return selected.length ? new RoutedProvider(selected) : new UnavailableProvider();
}

const globalForMarketData = globalThis as unknown as { marketData?: MarketDataProvider };
export const marketData: MarketDataProvider =
  globalForMarketData.marketData ?? build();
if (process.env.NODE_ENV !== "production") globalForMarketData.marketData = marketData;
