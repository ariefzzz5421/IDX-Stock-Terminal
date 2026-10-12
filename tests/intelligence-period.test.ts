import test from "node:test";
import assert from "node:assert/strict";
import { formatResearchPeriod, parseResearchPeriod, periodOptions } from "../lib/intelligence/period";

test("monthly research period uses Jakarta month boundaries", () => {
  const bounds = parseResearchPeriod("2026-10");
  assert.ok(bounds);
  assert.equal(bounds.start.toISOString(), "2026-09-30T17:00:00.000Z");
  assert.equal(bounds.end.toISOString(), "2026-10-31T17:00:00.000Z");
});

test("invalid research periods are ignored", () => {
  assert.equal(parseResearchPeriod("2026-13"), null);
  assert.equal(parseResearchPeriod("26-01"), null);
  assert.equal(formatResearchPeriod("invalid"), "Semua periode");
});

test("period choices include each month across available years, newest first", () => {
  assert.deepEqual(periodOptions(new Date("2025-12-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z")), ["2026-02", "2026-01", "2025-12"]);
  assert.deepEqual(periodOptions(null, null), []);
});
