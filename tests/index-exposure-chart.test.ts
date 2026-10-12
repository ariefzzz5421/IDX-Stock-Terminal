import assert from "node:assert/strict";
import test from "node:test";
import { indexFlowSlices, indexWeightSlices } from "../lib/index-exposure-chart";
import { INDONESIA_INDEX_SNAPSHOTS } from "../lib/index-exposure";
import type { ForeignFlowResult } from "../lib/foreign-flow";

const [msci, ftse] = INDONESIA_INDEX_SNAPSHOTS;

test("pie weights preserve the complete MSCI index and FTSE remainder", () => {
  const msciSlices = indexWeightSlices(msci);
  const ftseSlices = indexWeightSlices(ftse);
  assert.equal(msciSlices.reduce((sum, slice) => sum + slice.value, 0).toFixed(2), "100.00");
  assert.equal(msciSlices.some((slice) => slice.code === null), false);
  assert.equal(ftseSlices.reduce((sum, slice) => sum + slice.value, 0).toFixed(2), "100.00");
  assert.equal(ftseSlices.at(-1)?.label, "29 saham lainnya");
  assert.equal(ftseSlices.at(-1)?.value, 24.89);
});

test("flow pie contains only reported constituent tickers and keeps sell direction", () => {
  const row = (code: string, value: number) => ({ code, name: code, logoUrl: null, foreignBuy: null, foreignSell: null, netShares: value, estimatedNetValue: value, close: null });
  const flow: ForeignFlowResult = { available: true, date: "2026-10-12", source: "IDX", topBuy: [row("BBCA", 100_000_000), row("UNLISTED", 1_000_000_000)], topSell: [row("BBRI", -50_000_000)] };
  assert.deepEqual(indexFlowSlices(msci, flow).map(({ code, value, netValue }) => ({ code, value, netValue })), [
    { code: "BBCA", value: 100_000_000, netValue: 100_000_000 },
    { code: "BBRI", value: 50_000_000, netValue: -50_000_000 },
  ]);
  assert.deepEqual(indexFlowSlices(msci, { available: false, date: null, source: null, topBuy: [], topSell: [], diagnostics: { idx: "blocked", invezgo: "missing" } }), []);
});
