import type { Quote } from "./types";

/** Sanity checks only: do not confuse a syntactically valid quote with a verified market price. */
export function validateQuote(quote: Quote | null, code: string, now = Date.now()): boolean {
  if (!quote || quote.code.toUpperCase() !== code.toUpperCase()) return false;
  const nums = [quote.price, quote.prevClose, quote.change, quote.changePct, quote.open, quote.high, quote.low, quote.volume, quote.value, quote.timestamp];
  if (nums.some((n) => !Number.isFinite(n))) return false;
  if (quote.price <= 0 || quote.prevClose <= 0 || quote.open <= 0 || quote.low <= 0 || quote.high < quote.low) return false;
  if (quote.volume < 0 || quote.value < 0) return false;
  if (quote.timestamp < Date.UTC(2015, 0, 1) || quote.timestamp > now + 5 * 60_000) return false;
  // Most providers report rounded percentages. Allow that without accepting obvious mismatches.
  const expectedChange = quote.price - quote.prevClose;
  const expectedPct = (expectedChange / quote.prevClose) * 100;
  if (Math.abs(quote.change - expectedChange) > Math.max(1, quote.price * 0.001)) return false;
  if (Math.abs(quote.changePct - expectedPct) > 0.75) return false;
  return true;
}

export type QuoteFreshness = "delayed" | "stale" | "timestamp-unverified";

/** 'delayed' is intentional; free quotes must not be labeled real-time. */
export function quoteFreshness(quote: Quote, now = Date.now()): QuoteFreshness {
  if (!quote.timestampVerified) return "timestamp-unverified";
  return now - quote.timestamp > 3 * 86_400_000 ? "stale" : "delayed";
}

export type QuoteComparison = "agree" | "disputed" | "not-comparable";

/** Only compare actual exchange timestamps. Provider fetch timestamps are NOT comparable. */
export function compareQuotes(a: Quote, b: Quote, maxDiffPct = 1): QuoteComparison {
  if (!a.timestampVerified || !b.timestampVerified || a.code !== b.code) return "not-comparable";
  if (Math.abs(a.timestamp - b.timestamp) > 5 * 60_000) return "not-comparable";
  if (a.price <= 0 || b.price <= 0) return "not-comparable";
  const deviation = Math.abs(a.price - b.price) / Math.min(a.price, b.price) * 100;
  return deviation > maxDiffPct ? "disputed" : "agree";
}
