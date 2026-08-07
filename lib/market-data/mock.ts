import {
  INTERVAL_MS,
  snapToTick,
  tickSize,
  type Candle,
  type Interval,
  type MarketDataProvider,
  type Quote,
  type QuoteListener,
  type Unsubscribe,
} from "./types";

/**
 * Offline provider. Generates a plausible random walk so the whole terminal —
 * watchlist, chart, pump detector — runs end to end without signing up for
 * anything. Nothing here is real market data.
 *
 * Starting prices for well-known tickers are set to roughly the right order of
 * magnitude, purely so the UI looks sane; they are not quotes. Anything not
 * listed gets a price derived from its code.
 */
const SEED_PRICES: Record<string, number> = {
  BBCA: 8700, BBRI: 4180, BMRI: 5150, BBNI: 5325, BBTN: 1240, BRIS: 2680,
  ARTO: 2150, BTPS: 985, BFIN: 1050, SRTG: 2340, PNLF: 468,
  ADRO: 2340, PTBA: 2830, ITMG: 24500, PGAS: 1580, MEDC: 1310, AKRA: 1225,
  BREN: 6200, CUAN: 7800, RAJA: 1985, INDY: 1420, HRUM: 1180,
  ANTM: 1545, INCO: 3520, TINS: 1015, MDKA: 1890, AMMN: 8150, INTP: 6725,
  SMGR: 3410, BRPT: 985, TPIA: 7350, ESSA: 745, INKP: 7900, TKIM: 6950, NCKL: 890,
  UNVR: 1730, ICBP: 10500, INDF: 6875, MYOR: 2510, GGRM: 15800, HMSP: 685,
  AMRT: 2890, CPIN: 4820, JPFA: 1735, AALI: 6150, LSIP: 1085,
  MAPI: 1420, ACES: 705, ERAA: 425, SCMA: 158, MNCN: 296, MAPA: 810,
  KLBF: 1495, MIKA: 2740, SIDO: 615, HEAL: 1385,
  ASII: 4950, UNTR: 26150,
  GOTO: 68, BUKA: 122, EMTK: 448, DCII: 38500, MTDL: 605,
  TLKM: 2890, ISAT: 2110, EXCL: 2280, TOWR: 615, TBIG: 1935, JSMR: 4470,
  WIKA: 178, PTPP: 336, ADHI: 218,
  BSDE: 985, CTRA: 1085, PWON: 424, SMRA: 495, PANI: 12400,
};

/** Deterministic per-code hash, so a fallback price is stable across restarts. */
function hashCode(code: string): number {
  let h = 2166136261;
  for (let i = 0; i < code.length; i++) {
    h ^= code.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function basePrice(code: string): number {
  const seeded = SEED_PRICES[code];
  if (seeded) return seeded;
  // 50 .. 12,000 — the range most IDX tickers actually live in.
  return snapToTick(50 + hashCode(code) * 11950);
}

type WalkState = {
  prevClose: number;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  value: number;
};

/** Module-level so every caller in a process sees a consistent walk. */
const state = new Map<string, WalkState>();

function stateFor(code: string): WalkState {
  const existing = state.get(code);
  if (existing) return existing;

  const prevClose = basePrice(code);
  // Open somewhere within ±1.5% of the previous close.
  const open = snapToTick(prevClose * (1 + (hashCode(code + "o") - 0.5) * 0.03));

  const fresh: WalkState = {
    prevClose,
    price: open,
    open,
    high: Math.max(open, prevClose),
    low: Math.min(open, prevClose),
    // Roughly inverse to price, the way turnover actually distributes.
    volume: Math.round((5_000_000_000 / prevClose) * (0.4 + hashCode(code + "v"))),
    value: 0,
  };
  fresh.value = fresh.volume * fresh.price;
  state.set(code, fresh);
  return fresh;
}

/** Advance one step of the walk and return the resulting quote. */
function step(code: string): Quote {
  const s = stateFor(code);
  const tick = tickSize(s.price);

  // Mean-reverting: the further from the open, the stronger the pull back.
  const drift = ((s.open - s.price) / s.open) * 0.35;
  const shock = (Math.random() - 0.5 + drift) * 3;
  const steps = Math.round(shock);

  if (steps !== 0) {
    s.price = Math.max(tick, s.price + steps * tick);
    s.high = Math.max(s.high, s.price);
    s.low = Math.min(s.low, s.price);
  }

  const traded = Math.round(s.volume * (0.0005 + Math.random() * 0.002));
  s.volume += traded;
  s.value += traded * s.price;

  return toQuote(code, s);
}

function toQuote(code: string, s: WalkState): Quote {
  const change = s.price - s.prevClose;
  return {
    code,
    price: s.price,
    prevClose: s.prevClose,
    change,
    changePct: (change / s.prevClose) * 100,
    open: s.open,
    high: s.high,
    low: s.low,
    volume: s.volume,
    value: Math.round(s.value),
    timestamp: Date.now(),
  };
}

export class MockProvider implements MarketDataProvider {
  readonly name = "mock";
  readonly ready = true;

  async getQuote(code: string): Promise<Quote> {
    return step(code.toUpperCase());
  }

  async getQuotes(codes: string[]): Promise<Quote[]> {
    return codes.map((code) => step(code.toUpperCase()));
  }

  async getOHLCV(
    code: string,
    interval: Interval,
    limit = 120,
  ): Promise<Candle[]> {
    const upper = code.toUpperCase();
    const s = stateFor(upper);
    const stepMs = INTERVAL_MS[interval];
    const now = Date.now();

    // Walk backwards from the current price so the last candle closes where
    // the watchlist says it does.
    const closes: number[] = [s.price];
    for (let i = 1; i < limit; i++) {
      const previous = closes[0];
      const tick = tickSize(previous);
      const drift = (Math.random() - 0.5) * 3;
      closes.unshift(Math.max(tick, previous - Math.round(drift) * tick));
    }

    return closes.map((close, i) => {
      const open = i === 0 ? closes[0] : closes[i - 1];
      const tick = tickSize(close);
      const wick = Math.round(Math.random() * 2) * tick;
      return {
        time: now - (limit - 1 - i) * stepMs,
        open,
        high: Math.max(open, close) + wick,
        low: Math.max(tick, Math.min(open, close) - wick),
        close,
        volume: Math.round((s.volume / limit) * (0.4 + Math.random() * 1.2)),
      };
    });
  }

  subscribeLive(codes: string[], onQuote: QuoteListener): Unsubscribe {
    const upper = codes.map((c) => c.toUpperCase());
    const every = Number(process.env.QUOTE_POLL_INTERVAL_MS ?? 5000);

    const timer = setInterval(() => {
      // Only a slice moves each round, the way a real tape behaves.
      const moving = Math.max(1, Math.round(upper.length * 0.4));
      for (let i = 0; i < moving; i++) {
        const code = upper[Math.floor(Math.random() * upper.length)];
        onQuote(step(code));
      }
    }, Math.max(500, every));

    return () => clearInterval(timer);
  }
}
