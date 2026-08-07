import {
  INTERVAL_MS,
  type Candle,
  type Interval,
  type MarketDataProvider,
  type Quote,
  type QuoteListener,
  type Unsubscribe,
} from "./types";
import { pollingSubscription } from "./polling";

/**
 * GoAPI.io — REST snapshots for IDX.
 *
 * ⚠️ The endpoint paths and response shape below are a best-effort mapping and
 * have NOT been verified against a live account. Check the current docs at
 * https://goapi.io/docs before relying on this, and adjust `mapQuote` /
 * `mapCandle` — they are deliberately the only places the wire format is
 * touched, so correcting them is a small edit.
 *
 * Override the base URL with GOAPI_BASE_URL if the paths have moved.
 */
const BASE_URL = process.env.GOAPI_BASE_URL ?? "https://api.goapi.io/stock/idx";

type GoApiEnvelope<T> = { status?: string; message?: string; data?: T };

type GoApiQuote = {
  symbol?: string;
  close?: number;
  previous?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  value?: number;
  change?: number;
  change_percent?: number;
};

type GoApiBar = {
  date?: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
};

function mapQuote(raw: GoApiQuote, fallbackCode: string): Quote | null {
  const price = raw.close;
  if (typeof price !== "number") return null;

  const prevClose = raw.previous ?? price;
  const change = raw.change ?? price - prevClose;

  return {
    code: (raw.symbol ?? fallbackCode).toUpperCase(),
    price,
    prevClose,
    change,
    changePct: raw.change_percent ?? (prevClose ? (change / prevClose) * 100 : 0),
    open: raw.open ?? price,
    high: raw.high ?? price,
    low: raw.low ?? price,
    volume: raw.volume ?? 0,
    value: raw.value ?? 0,
    timestamp: Date.now(),
  };
}

function mapCandle(raw: GoApiBar): Candle | null {
  if (typeof raw.close !== "number") return null;
  return {
    time: raw.date ? new Date(raw.date).getTime() : Date.now(),
    open: raw.open ?? raw.close,
    high: raw.high ?? raw.close,
    low: raw.low ?? raw.close,
    close: raw.close,
    volume: raw.volume ?? 0,
  };
}

export class GoApiProvider implements MarketDataProvider {
  readonly name = "goapi";
  private readonly apiKey = process.env.GOAPI_KEY ?? "";

  get ready() {
    return this.apiKey.length > 0;
  }

  private async request<T>(path: string, params: Record<string, string> = {}) {
    const url = new URL(`${BASE_URL}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    url.searchParams.set("api_key", this.apiKey);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      // Quotes must never come from the Next.js data cache.
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `GoAPI ${path} returned ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as GoApiEnvelope<T>;
  }

  async getQuote(code: string): Promise<Quote | null> {
    const upper = code.toUpperCase();
    const body = await this.request<GoApiQuote>(`/${upper}/prices`);
    return body.data ? mapQuote(body.data, upper) : null;
  }

  async getQuotes(codes: string[]): Promise<Quote[]> {
    const results = await Promise.allSettled(
      codes.map((code) => this.getQuote(code)),
    );

    // One bad ticker shouldn't blank the whole watchlist.
    return results.flatMap((r) =>
      r.status === "fulfilled" && r.value ? [r.value] : [],
    );
  }

  async getOHLCV(
    code: string,
    interval: Interval,
    limit = 120,
  ): Promise<Candle[]> {
    const upper = code.toUpperCase();
    const from = new Date(Date.now() - INTERVAL_MS[interval] * limit);

    const body = await this.request<GoApiBar[]>(`/${upper}/historical`, {
      from: from.toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
    });

    return (body.data ?? []).flatMap((bar) => {
      const candle = mapCandle(bar);
      return candle ? [candle] : [];
    });
  }

  /** REST only — the shared poller turns it into a stream. */
  subscribeLive(codes: string[], onQuote: QuoteListener): Unsubscribe {
    return pollingSubscription(this, codes, onQuote);
  }
}
