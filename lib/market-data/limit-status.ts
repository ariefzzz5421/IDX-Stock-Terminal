import listing from "@/data/idx-stock-list-20261012.json";

const BOARDS = new Map(listing.stocks.map((stock) => [stock.code, stock.board]));

/** A price-bound indicator, never an exchange-confirmed trading status. */
export type LimitStatus = "ARA_INDICATIVE" | "ARB_INDICATIVE";

function tick(price: number) {
  return price <= 200 ? 1 : price <= 500 ? 2 : price <= 2_000 ? 5 : price <= 5_000 ? 10 : 25;
}

export function indicativeLimitStatus(code: string, price: number | null, changePct: number | null): LimitStatus | null {
  const board = BOARDS.get(code);
  if ((board !== "UTAMA" && board !== "PENGEMBANGAN") || price === null || changePct === null || price <= 0 || changePct <= -99) return null;
  const previous = Math.round(price / (1 + changePct / 100));
  if (previous <= 0 || Math.abs((price / previous - 1) * 100 - changePct) > 0.03) return null;
  const upperPct = previous <= 200 ? 35 : previous <= 5_000 ? 25 : 20;
  const lowerPct = 15;
  const upperRaw = previous <= 10 ? previous + 1 : previous * (1 + upperPct / 100);
  const lowerRaw = previous <= 10 ? Math.max(1, previous - 1) : previous * (1 - lowerPct / 100);
  const upper = Math.floor(upperRaw / tick(upperRaw)) * tick(upperRaw);
  const lower = Math.ceil(lowerRaw / tick(lowerRaw)) * tick(lowerRaw);
  if (changePct > 0 && price === upper) return "ARA_INDICATIVE";
  if (changePct < 0 && price === lower) return "ARB_INDICATIVE";
  return null;
}
