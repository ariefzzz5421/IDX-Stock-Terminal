import assert from "node:assert/strict";
import test from "node:test";
import { verifiedDailySummaryRows } from "../lib/market-data/idx-summary-validation";

const make = (count: number, date = "2026-11-05") =>
  Array.from({ length: count }, (_, i) => ({
    code: "A" + String(i).padStart(3, "0"),
    date: date + "T00:00:00",
    volume: 100_000 + i,
    value: 95_000_000_000 + i,
  }));

test("BEI value is the upstream turnover, NOT close times shares", () => {
  const rows = verifiedDailySummaryRows([{ code: "BBCA", date: "2026-11-05", volume: 100, value: 990_000 }], "2026-11-05", 1);
  assert.equal(rows[0].value, 990_000);
  assert.notEqual(rows[0].value, 10_000 * rows[0].volume);
});

test("rejects wrong trading date and truncated replies", () => {
  assert.equal(verifiedDailySummaryRows(make(699), "2026-11-05").length, 0);
  assert.equal(verifiedDailySummaryRows(make(900, "2026-11-04"), "2026-11-05").length, 0);
  assert.equal(verifiedDailySummaryRows(make(900), "2026-11-05").length, 900);
});

test("rejects invalid or duplicate market rows instead of inventing zeros", () => {
  const broken = make(900);
  broken[0] = { ...broken[0], value: -10 };
  assert.equal(verifiedDailySummaryRows(broken, "2026-11-05").length, 899);
  const duplicate = make(900);
  duplicate[10] = { ...duplicate[10], code: duplicate[0].code };
  assert.equal(verifiedDailySummaryRows(duplicate, "2026-11-05").length, 899);
  const mostlyBroken = make(900).map((row,i) => i < 100 ? { ...row, date: "2026-11-04T00:00:00" } : row);
  assert.equal(verifiedDailySummaryRows(mostlyBroken, "2026-11-05").length, 0);
});
