import test from "node:test";
import assert from "node:assert/strict";
import { INDONESIA_INDEX_SNAPSHOTS } from "../lib/index-exposure";

test("published constituent weights reconcile to each official factsheet", () => {
  const msci = INDONESIA_INDEX_SNAPSHOTS.find((snapshot) => snapshot.provider === "MSCI");
  const ftse = INDONESIA_INDEX_SNAPSHOTS.find((snapshot) => snapshot.provider === "FTSE Russell");
  assert.ok(msci);
  assert.ok(ftse);
  assert.equal(msci.constituents.length, 9);
  assert.ok(Math.abs(msci.constituents.reduce((sum, row) => sum + row.weightPct, 0) - 100) < 0.001);
  assert.equal(ftse.constituents.length, 10);
  assert.ok(Math.abs(ftse.constituents.reduce((sum, row) => sum + row.weightPct, 0) - ftse.topWeightPct) < 0.02, "top-10 total differs only by published rounding");
});

test("snapshot values are positive, sourced, and tied to known IDX tickers", () => {
  const known = new Set(["BBCA", "BBRI", "BMRI", "TLKM", "ASII", "BBNI", "BRMS", "UNTR", "BRPT", "AMMN", "GOTO"]);
  for (const snapshot of INDONESIA_INDEX_SNAPSHOTS) {
    assert.match(snapshot.sourceUrl, /^https:\/\//);
    assert.match(snapshot.snapshotDate, /^2026-\d{2}-\d{2}$/);
    for (const row of snapshot.constituents) {
      assert.ok(known.has(row.code), `${row.code} should be a listed ticker in this snapshot`);
      assert.ok(row.weightPct > 0 && row.weightPct <= 100);
      assert.ok(row.capValue > 0);
    }
  }
});
