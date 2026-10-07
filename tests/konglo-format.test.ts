import assert from "node:assert/strict";
import test from "node:test";
import { formatWealth, formatWealthRupiahEstimate, WEALTH_USD_IDR_RATE } from "../lib/konglo-format";

test("Forbes USD wealth is abbreviated consistently for every profile", () => {
  assert.equal(formatWealth(8.3e9), "US$8,3B");
  assert.equal(formatWealth(43.8e9), "US$43,8B");
  assert.equal(formatWealth(1.25e9), "US$1,25B");
  assert.equal(formatWealth(), "N/D");
});

test("IDR wealth estimate uses the disclosed BI reference rate", () => {
  assert.equal(WEALTH_USD_IDR_RATE, 17_910);
  assert.equal(formatWealthRupiahEstimate(8.3e9), "EST Rp 148,7T");
  assert.equal(formatWealthRupiahEstimate(), "N/D");
});
