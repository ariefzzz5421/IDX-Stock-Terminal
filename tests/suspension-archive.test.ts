import assert from "node:assert/strict";
import test from "node:test";
import {
  SUSPENSION_ARCHIVE,
  SUSPENSION_ARCHIVE_AS_OF,
  wasInSuspensionArchive,
} from "../lib/market-data/suspension-archive";

test("suspension list remains a dated historical BEI record, not a live flag", () => {
  assert.equal(SUSPENSION_ARCHIVE_AS_OF, "2026-06-30");
  assert.equal(SUSPENSION_ARCHIVE.length, 59);
  assert.equal(new Set(SUSPENSION_ARCHIVE.map(row => row.code)).size, 59);
  assert.equal(wasInSuspensionArchive("MKNT"), true);
  assert.equal(wasInSuspensionArchive("mknt"), true);
  assert.equal(wasInSuspensionArchive("BBCA"), false);
});
test("all archive records are valid ticker codes with reference start dates", () => {
  for (const row of SUSPENSION_ARCHIVE) {
    assert.match(row.code, /^[A-Z]{4}$/);
    assert.match(row.since, /^\d{1,2}-[A-Za-z]{3}-\d{2}$/);
  }
});
