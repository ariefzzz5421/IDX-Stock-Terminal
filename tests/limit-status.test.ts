import test from "node:test";
import assert from "node:assert/strict";
import { indicativeLimitStatus } from "../lib/market-data/limit-status";

test("regular-board upper and lower price-bound badges are indicative", () => {
  assert.equal(indicativeLimitStatus("STRK", 83, 33.87), "ARA_INDICATIVE");
  assert.equal(indicativeLimitStatus("BSWD", 3600, 25), "ARA_INDICATIVE");
  assert.equal(indicativeLimitStatus("KDTN", 472, -14.95), "ARB_INDICATIVE");
});

test("no badge is inferred from zero movement or special-monitoring board", () => {
  assert.equal(indicativeLimitStatus("GOTO", 30, 0), null);
  assert.equal(indicativeLimitStatus("ALMI", 20, 25), null);
  assert.equal(indicativeLimitStatus("STRK", null, 35), null);
});
