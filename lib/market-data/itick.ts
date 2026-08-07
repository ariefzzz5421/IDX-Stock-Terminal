import WebSocket from "ws";
import {
  type Candle,
  type Interval,
  type MarketDataProvider,
  type Quote,
  type QuoteListener,
  type Unsubscribe,
} from "./types";

/**
 * iTick — the one provider here with a real upstream WebSocket, so
 * `subscribeLive` streams rather than polls.
 *
 * ⚠️ The subscribe frame and tick field names below are a best-effort mapping
 * and have NOT been verified against a live account. Check
 * https://itick.org docs and adjust `SUBSCRIBE_FRAME` / `mapTick`. Override
 * endpoints with ITICK_WS_URL and ITICK_BASE_URL.
 *
 * Only ever constructed server-side — the token must not reach the browser.
 */
const WS_URL = process.env.ITICK_WS_URL ?? "wss://api.itick.org/sws";
const BASE_URL = process.env.ITICK_BASE_URL ?? "https://api.itick.org";
const REGION = "ID";

/** Upstream drops idle sockets; keep it warm. */
const HEARTBEAT_MS = 25_000;
const RECONNECT_DELAY_MS = 3_000;

type ItickTick = {
  s?: string;
  ld?: number;
  yc?: number;
  o?: number;
  h?: number;
  l?: number;
  v?: number;
  tu?: number;
  t?: number;
};

function mapTick(raw: ItickTick): Quote | null {
  if (!raw.s || typeof raw.ld !== "number") return null;

  const price = raw.ld;
  const prevClose = raw.yc ?? price;
  const change = price - prevClose;

  return {
    code: raw.s.toUpperCase(),
    price,
    prevClose,
    change,
    changePct: prevClose ? (change / prevClose) * 100 : 0,
    open: raw.o ?? price,
    high: raw.h ?? price,
    low: raw.l ?? price,
    volume: raw.v ?? 0,
    value: raw.tu ?? 0,
    timestamp: raw.t ?? Date.now(),
  };
}

export class ItickProvider implements MarketDataProvider {
  readonly name = "itick";
  private readonly token = process.env.ITICK_TOKEN ?? "";

  get ready() {
    return this.token.length > 0;
  }

  private async request<T>(path: string, params: Record<string, string>) {
    const url = new URL(`${BASE_URL}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: { Accept: "application/json", token: this.token },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `iTick ${path} returned ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as { data?: T };
  }

  async getQuote(code: string): Promise<Quote | null> {
    const upper = code.toUpperCase();
    const body = await this.request<ItickTick>("/stock/tick", {
      region: REGION,
      code: upper,
    });
    return body.data ? mapTick(body.data) : null;
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
    const body = await this.request<ItickTick[]>("/stock/kline", {
      region: REGION,
      code: code.toUpperCase(),
      kType: interval,
      limit: String(limit),
    });

    return (body.data ?? []).flatMap((bar) => {
      if (typeof bar.ld !== "number") return [];
      return [
        {
          time: bar.t ?? Date.now(),
          open: bar.o ?? bar.ld,
          high: bar.h ?? bar.ld,
          low: bar.l ?? bar.ld,
          close: bar.ld,
          volume: bar.v ?? 0,
        },
      ];
    });
  }

  subscribeLive(codes: string[], onQuote: QuoteListener): Unsubscribe {
    let socket: WebSocket | null = null;
    let heartbeat: NodeJS.Timeout | null = null;
    let reconnect: NodeJS.Timeout | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;

      socket = new WebSocket(WS_URL);

      socket.on("open", () => {
        socket?.send(JSON.stringify({ ac: "auth", params: this.token }));
        socket?.send(
          JSON.stringify({
            ac: "subscribe",
            params: codes.map((c) => c.toUpperCase()).join(","),
            types: "quote",
          }),
        );

        heartbeat = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ ac: "ping" }));
          }
        }, HEARTBEAT_MS);
      });

      socket.on("message", (raw) => {
        try {
          const parsed = JSON.parse(raw.toString()) as { data?: ItickTick };
          const quote = parsed.data ? mapTick(parsed.data) : null;
          if (quote) onQuote(quote);
        } catch {
          // A malformed frame is not worth tearing the stream down for.
        }
      });

      socket.on("error", (error) => {
        console.error("[market-data] iTick socket error:", error.message);
      });

      socket.on("close", () => {
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = null;
        if (!closed) reconnect = setTimeout(connect, RECONNECT_DELAY_MS);
      });
    };

    connect();

    return () => {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      if (reconnect) clearTimeout(reconnect);
      socket?.close();
    };
  }
}
