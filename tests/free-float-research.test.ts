import assert from "node:assert/strict";
import test from "node:test";
import { assessFloatHolders, investorTypeCode, type FloatHolderInput } from "../lib/free-float-research";

const holder = (name: string, percentage: number, investorType: string, affiliated = false): FloatHolderInput => ({
  name, percentage, investorType, shares: percentage * 1_000_000,
  affiliation: affiliated ? { label: "Pendiri", sourceUrl: "https://example.com/source" } : null,
});

test("type-based strategic holdings and verified insider holdings reduce indicative float separately", () => {
  const result = assessFloatHolders([
    holder("PT Pengendali", 60, "Corporate"),
    holder("Pendiri", 8, "Individual", true),
    holder("Investor pribadi", 5, "Individual"),
    holder("Reksa dana", 4, "Mutual Funds"),
  ]);
  assert.equal(result.indicativeFloatPercent, 32);
  assert.equal(result.undisclosedPercent, 23);
  assert.deepEqual(result.holders.map((item) => item.treatment), [
    "type-strategic", "verified-affiliate", "unverified", "unverified",
  ]);
});

test("missing holders never imply 100 percent float", () => {
  assert.equal(assessFloatHolders([]).indicativeFloatPercent, null);
});

test("inconsistent positions above 100 percent suppress the estimate", () => {
  assert.equal(assessFloatHolders([holder("A", 70, "Corporate"), holder("B", 40, "Corporate")]).indicativeFloatPercent, null);
});

test("known investor types have explicit badges and unknown types are not mislabeled", () => {
  assert.equal(investorTypeCode("Corporate"), "CP");
  assert.equal(investorTypeCode("Individual"), "ID");
  assert.equal(investorTypeCode("Unknown"), "—");
});
