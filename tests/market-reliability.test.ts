import assert from "node:assert/strict";
import test from "node:test";
import { compareQuotes, quoteFreshness, validateQuote } from "../lib/market-data/reliability";
import type { Quote } from "../lib/market-data/types";

const now = Date.UTC(2026, 9, 24, 7);
function sample(overrides: Partial<Quote> = {}): Quote {
  return {
    code: "BBCA", price: 8000, prevClose: 7950, change: 50,
    changePct: (50 / 7950) * 100,
    open: 7950, high: 8050, low: 7900, volume: 1_000_000,
    value: 8_000_000_000, timestamp: now - 600_000,
    timestampVerified: true, source: "yahoo", ...overrides,
  };
}

test("validates a structurally consistent quote", () => {
  assert.equal(validateQuote(sample(), "BBCA", now), true);
});
test("rejects wrong tickers and impossible prices before database writes", () => {
  assert.equal(validateQuote(sample({ code: "BBRI" }), "BBCA", now), false);
  assert.equal(validateQuote(sample({ price: -1 }), "BBCA", now), false);
  assert.equal(validateQuote(sample({ price: Number.NaN }), "BBCA", now), false);
  assert.equal(validateQuote(sample({ changePct: 99 }), "BBCA", now), false);
  assert.equal(validateQuote(sample({ timestamp: now + 900_000 }), "BBCA", now), false);
});
test("does not claim provider ingestion time is exchange trade time", () => {
  assert.equal(quoteFreshness(sample({ timestampVerified: false }), now), "timestamp-unverified");
  assert.equal(quoteFreshness(sample({ timestamp: now - 4 * 86_400_000 }), now), "stale");
  assert.equal(quoteFreshness(sample(), now), "delayed");
});
test("cross-source comparisons require exchange-time aligned sources", () => {
  assert.equal(compareQuotes(sample(), sample({ price: 8100, change: 150, changePct: (150 / 7950) * 100 })), "disputed");
  assert.equal(compareQuotes(sample(), sample({ price: 8005, change: 55, changePct: (55 / 7950) * 100 })), "agree");
  assert.equal(compareQuotes(sample(), sample({ timestampVerified: false })), "not-comparable");
  assert.equal(compareQuotes(sample(), sample({ timestamp: now - 3_600_000 })), "not-comparable");
});
