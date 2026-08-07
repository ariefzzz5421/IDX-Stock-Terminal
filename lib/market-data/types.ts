/** A single snapshot for one ticker. Prices are IDR. */
export type Quote = {
  code: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  /** Shares traded today. */
  volume: number;
  /** Rupiah traded today. */
  value: number;
  /** Epoch milliseconds. */
  timestamp: number;
};

export type Candle = {
  /** Epoch milliseconds at the open of the bar. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Interval = "1m" | "5m" | "15m" | "1h" | "1d";

export type QuoteListener = (quote: Quote) => void;
export type Unsubscribe = () => void;

/**
 * Every provider implements this, so swapping one for another never reaches
 * the UI. Adapters live alongside this file; `index.ts` picks one from
 * MARKET_DATA_PROVIDER.
 */
export interface MarketDataProvider {
  readonly name: string;
  /** True when the adapter has whatever credentials it needs. */
  readonly ready: boolean;

  getQuote(code: string): Promise<Quote | null>;
  getQuotes(codes: string[]): Promise<Quote[]>;
  getOHLCV(code: string, interval: Interval, limit?: number): Promise<Candle[]>;

  /**
   * Push updates for `codes`. Providers without a stream poll internally.
   * Returns a function that stops the subscription.
   */
  subscribeLive(codes: string[], onQuote: QuoteListener): Unsubscribe;
}

/**
 * IDX price ticks (fraksi harga) — the exchange only accepts prices on these
 * increments, so synthetic and rounded values must snap to them too.
 */
export function tickSize(price: number): number {
  if (price < 200) return 1;
  if (price < 500) return 2;
  if (price < 2000) return 5;
  if (price < 5000) return 10;
  return 25;
}

export function snapToTick(price: number): number {
  const tick = tickSize(price);
  return Math.max(tick, Math.round(price / tick) * tick);
}

export const INTERVAL_MS: Record<Interval, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  "1d": 24 * 60 * 60_000,
};
