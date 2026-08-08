import {
  type Candle,
  type Interval,
  type MarketDataProvider,
  type Quote,
  type QuoteListener,
  type Unsubscribe,
} from "./types";
import { pollingSubscription } from "./polling";

/**
 * Yahoo Finance. No API key, no signup, and it actually knows IDX — Jakarta
 * tickers are the plain code plus a `.JK` suffix, quoted in rupiah.
 *
 * Free and unofficial, so treat it as best-effort: quotes are delayed, and
 * Yahoo can rate-limit or change shape without notice. Everything that touches
 * the wire format is isolated in mapQuote / mapCandles.
 */
const CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

/** Yahoo's own names for the ranges/intervals we expose. */
const INTERVAL_MAP: Record<Interval, { interval: string; range: string }> = {
  "1m": { interval: "1m", range: "1d" },
  "5m": { interval: "5m", range: "5d" },
  "15m": { interval: "15m", range: "1mo" },
  "1h": { interval: "60m", range: "3mo" },
  "1d": { interval: "1d", range: "1y" },
};

export function toYahooSymbol(code: string): string {
  return `${code.toUpperCase()}.JK`;
}

type YahooMeta = {
  symbol?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketTime?: number;
};

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: YahooMeta;
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
    error?: { code?: string; description?: string };
  };
};

function mapQuote(body: YahooChart, code: string): Quote | null {
  const result = body.chart?.result?.[0];
  const meta = result?.meta;

  if (!meta || typeof meta.regularMarketPrice !== "number") return null;

  const price = meta.regularMarketPrice;

  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prevClose;

  // Yahoo's meta has no open, so take the first candle of the session.
  const opens = result?.indicators?.quote?.[0]?.open ?? [];
  const firstOpen = opens.find((v) => typeof v === "number") ?? undefined;

  return {
    code,
    price,
    prevClose,
    change,
    changePct: prevClose ? (change / prevClose) * 100 : 0,
    open: firstOpen ?? price,
    high: meta.regularMarketDayHigh ?? price,
    low: meta.regularMarketDayLow ?? price,
    volume: meta.regularMarketVolume ?? 0,
    // Yahoo doesn't report turnover, so approximate it.
    value: (meta.regularMarketVolume ?? 0) * price,
    timestamp: meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now(),
  };
}

function mapCandles(body: YahooChart): Candle[] {
  const result = body.chart?.result?.[0];
  const stamps = result?.timestamp ?? [];
  const series = result?.indicators?.quote?.[0];

  if (!series) return [];

  const candles: Candle[] = [];

  for (let i = 0; i < stamps.length; i++) {
    const close = series.close?.[i];
    // Yahoo pads holidays and halts with nulls; those aren't bars.
    if (typeof close !== "number") continue;

    candles.push({
      time: stamps[i] * 1000,
      open: series.open?.[i] ?? close,
      high: series.high?.[i] ?? close,
      low: series.low?.[i] ?? close,
      close,
      volume: series.volume?.[i] ?? 0,
    });
  }

  return candles;
}

export class YahooProvider implements MarketDataProvider {
  readonly name = "yahoo";
  /** Nothing to configure — this is why it's the default real provider. */
  readonly ready = true;

  private async chart(code: string, interval: string, range: string) {
    const url = new URL(`${CHART_URL}/${toYahooSymbol(code)}`);
    url.searchParams.set("interval", interval);
    url.searchParams.set("range", range);

    const response = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Yahoo chart ${code} returned ${response.status} ${response.statusText}`,
      );
    }

    const body = (await response.json()) as YahooChart;

    if (body.chart?.error) {
      throw new Error(
        `Yahoo chart ${code}: ${body.chart.error.description ?? body.chart.error.code}`,
      );
    }

    return body;
  }

  async getQuote(code: string): Promise<Quote | null> {
    const upper = code.toUpperCase();
    return mapQuote(await this.chart(upper, "1d", "5d"), upper);
  }

  async getQuotes(codes: string[]): Promise<Quote[]> {
    // Yahoo throttles bursts, so walk the list in small batches rather than
    // firing one request per ticker all at once.
    const BATCH = 8;
    const quotes: Quote[] = [];

    for (let i = 0; i < codes.length; i += BATCH) {
      const slice = codes.slice(i, i + BATCH);
      const settled = await Promise.allSettled(
        slice.map((code) => this.getQuote(code)),
      );

      for (const outcome of settled) {
        if (outcome.status === "fulfilled" && outcome.value) {
          quotes.push(outcome.value);
        } else if (outcome.status === "rejected") {
          console.warn("[market-data] yahoo quote failed:", outcome.reason);
        }
      }

      if (i + BATCH < codes.length) {
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
    }

    return quotes;
  }

  async getOHLCV(
    code: string,
    interval: Interval,
    limit = 120,
  ): Promise<Candle[]> {
    const mapped = INTERVAL_MAP[interval];
    const body = await this.chart(code, mapped.interval, mapped.range);
    return mapCandles(body).slice(-limit);
  }

  /** REST only — the shared poller turns it into a stream. */
  subscribeLive(codes: string[], onQuote: QuoteListener): Unsubscribe {
    return pollingSubscription(this, codes, onQuote);
  }
}
