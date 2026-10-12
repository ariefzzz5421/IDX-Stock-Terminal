import test from "node:test";
import assert from "node:assert/strict";
import official from "../data/idx-stock-list-20261012.json";
import catalog from "../prisma/idx-listing.json";

test("12 October BEI equity export matches every site catalog ticker", () => {
  const officialCodes = official.stocks.map((row) => row.code).sort();
  const catalogCodes = catalog.map((row) => row.code).sort();
  assert.equal(official.source, "https://www.idx.co.id/id/data-pasar/data-saham/daftar-saham/");
  assert.equal(official.downloadedAt, "2026-10-12");
  assert.equal(new Set(officialCodes).size, officialCodes.length);
  assert.deepEqual(officialCodes, catalogCodes);
});

test("BEI listing-board counts preserve the complete official export", () => {
  const boards = official.stocks.reduce<Record<string, number>>((counts, row) => {
    counts[row.board] = (counts[row.board] ?? 0) + 1;
    return counts;
  }, {});
  assert.deepEqual(boards, {
    UTAMA: 293,
    PENGEMBANGAN: 556,
    "EKONOMI BARU": 1,
    AKSELERASI: 43,
    "PEMANTAUAN KHUSUS": 69,
  });
});
