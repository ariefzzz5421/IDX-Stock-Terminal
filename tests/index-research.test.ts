import test from "node:test";
import assert from "node:assert/strict";
import { INDEX_RESEARCH, formatResearchDate } from "../lib/index-research";

test("official research archive runs from 2020 to 2026 in descending publication order", () => {
  const dates = INDEX_RESEARCH.map((item) => item.publishedAt);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.equal(new Set(INDEX_RESEARCH.map((item) => item.slug)).size, INDEX_RESEARCH.length);
  assert.deepEqual(new Set(dates.map((date) => date.slice(0, 4))), new Set(["2020", "2021", "2022", "2023", "2024", "2025", "2026"]));
  for (const item of INDEX_RESEARCH) {
    assert.ok(item.sourceUrl.startsWith("https://"));
    assert.match(item.publishedAt, /^20\d{2}-\d{2}(?:-\d{2})?$/);
    assert.ok(item.summary.length > 30);
  }
});

test("month-only publication dates do not invent a day", () => {
  assert.equal(formatResearchDate("2020-06"), "Juni 2020");
  assert.equal(formatResearchDate("2026-05-29"), "29 Mei 2026");
});
