import "server-only";

import type { MarketDataProvider } from "./types";
import { MockProvider } from "./mock";
import { YahooProvider } from "./yahoo";
import { GoApiProvider } from "./goapi";
import { ItickProvider } from "./itick";
import { InvezgoProvider } from "./invezgo";

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

function build(): MarketDataProvider {
  // Yahoo needs no credentials and returns real IDX prices, so it is the
  // sensible default; `mock` stays available for working offline.
  const requested = (process.env.MARKET_DATA_PROVIDER ?? "yahoo").toLowerCase();
  const Provider = PROVIDERS[requested as ProviderName];

  if (!Provider) {
    console.warn(
      `[market-data] Unknown MARKET_DATA_PROVIDER "${requested}". ` +
        `Expected one of: ${Object.keys(PROVIDERS).join(", ")}. Using mock.`,
    );
    return new MockProvider();
  }

  const provider = new Provider();

  // A missing API key would otherwise surface as an empty watchlist with no
  // explanation. Fall back loudly instead.
  if (!provider.ready) {
    console.warn(
      `[market-data] Provider "${requested}" has no API key configured, ` +
        `so it cannot fetch anything. Falling back to mock data. ` +
        `Set the matching key in .env to use it.`,
    );
    return new MockProvider();
  }

  return provider;
}

// One instance per process, cached across hot reloads like the Prisma client.
const globalForMarketData = globalThis as unknown as {
  marketData?: MarketDataProvider;
};

export const marketData: MarketDataProvider =
  globalForMarketData.marketData ?? build();

if (process.env.NODE_ENV !== "production") {
  globalForMarketData.marketData = marketData;
}
