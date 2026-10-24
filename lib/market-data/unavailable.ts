import type { Candle, Interval, MarketDataProvider, Quote, QuoteListener, Unsubscribe } from "./types";

/** Fail closed. Never fabricate market prices to cover upstream or configuration failures. */
export class UnavailableProvider implements MarketDataProvider {
  readonly name = "unavailable";
  readonly ready = false;

  async getQuote(_code: string): Promise<Quote | null> { return null; }
  async getQuotes(_codes: string[]): Promise<Quote[]> { return []; }
  async getOHLCV(_code: string, _interval: Interval, _limit?: number): Promise<Candle[]> { return []; }
  subscribeLive(_codes: string[], _onQuote: QuoteListener): Unsubscribe { return () => {}; }
}
