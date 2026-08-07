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
 * Invezgo — REST for Indonesian equities (prices, broker summary, foreign flow).
 *
 * ⚠️ Same caveat as the GoAPI adapter: paths and field names below are a
 * best-effort mapping, not verified against a live account. Confirm against the
 * provider's current docs and adjust `mapQuote` / `mapCandle`. Override the
 * base URL with INVEZGO_BASE_URL.
 */
const BASE_URL = process.env.INVEZGO_BASE_URL ?? "https://api.invezgo.com/v1";

type InvezgoQuote = {
  symbol?: string;
  last?: number;
  prev_close?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  value?: number;
  change?: number;
  change_pct?: number;
};

type InvezgoBar = {
  timestamp?: string | number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
};

function mapQuote(raw: InvezgoQuote, fallbackCode: string): Quote | null {
  const price = raw.last;
  if (typeof price !== "number") return null;

  const prevClose = raw.prev_close ?? price;
  const change = raw.change ?? price - prevClose;

  return {
    code: (raw.symbol ?? fallbackCode).toUpperCase(),
    price,
    prevClose,
    change,
    changePct: raw.change_pct ?? (prevClose ? (change / prevClose) * 100 : 0),
    open: raw.open ?? price,
    high: raw.high ?? price,
    low: raw.low ?? price,
    volume: raw.volume ?? 0,
    value: raw.value ?? 0,
    timestamp: Date.now(),
  };
}

function mapCandle(raw: InvezgoBar): Candle | null {
  if (typeof raw.close !== "number") return null;
  const t = raw.timestamp;
  return {
    time: typeof t === "number" ? t : t ? new Date(t).getTime() : Date.now(),
    open: raw.open ?? raw.close,
    high: raw.high ?? raw.close,
    low: raw.low ?? raw.close,
    close: raw.close,
    volume: raw.volume ?? 0,
  };
}

export class InvezgoProvider implements MarketDataProvider {
  readonly name = "invezgo";
  private readonly apiKey = process.env.INVEZGO_KEY ?? "";

  get ready() {
    return this.apiKey.length > 0;
  }

  private async request<T>(path: string, params: Record<string, string> = {}) {
    const url = new URL(`${BASE_URL}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Invezgo ${path} returned ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as { data?: T };
  }

  async getQuote(code: string): Promise<Quote | null> {
    const upper = code.toUpperCase();
    const body = await this.request<InvezgoQuote>(`/stocks/${upper}/quote`);
    return body.data ? mapQuote(body.data, upper) : null;
  }

  async getQuotes(codes: string[]): Promise<Quote[]> {
    const results = await Promise.allSettled(
      codes.map((code) => this.getQuote(code)),
    );
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
    const body = await this.request<InvezgoBar[]>(`/stocks/${upper}/candles`, {
      interval,
      limit: String(limit),
      from: String(Date.now() - INTERVAL_MS[interval] * limit),
    });

    return (body.data ?? []).flatMap((bar) => {
      const candle = mapCandle(bar);
      return candle ? [candle] : [];
    });
  }

  subscribeLive(codes: string[], onQuote: QuoteListener): Unsubscribe {
    return pollingSubscription(this, codes, onQuote);
  }
}
