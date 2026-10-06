import assert from "node:assert/strict";
import test from "node:test";
import { calculateDilution, calculateSizeToMarketCap, changeType, deriveRunStatus, eventIdentity, matchTickers, scoreMateriality } from "../lib/intelligence/core";
import { parseResearchResponse, verifyResearch } from "../lib/intelligence/validation";
import { cronAuthorized } from "../lib/intelligence/security";

test("matches only catalogued issuers and maps warrant codes to base ticker", () => {
  assert.deepEqual(matchTickers("BRNA-R and BRNA-W, plus fake ZZZZ", new Set(["BRNA", "TLKM"])), ["BRNA"]);
});

test("event identity survives a new document title within the same rights series", () => {
  const first = eventIdentity("BRNA", "RIGHTS_ISSUE", "Limited Public Offering III pursuant to Rights", new Date("2026-10-01"));
  const update = eventIdentity("BRNA", "RIGHTS_ISSUE", "Limited Public Offering III approved", new Date("2026-11-02"));
  assert.equal(first, update);
  assert.notEqual(
    eventIdentity("DOOH", "TENDER_OFFER", "Mandatory Tender Offer", new Date("2026-10-02"), "KSEI-1"),
    eventIdentity("DOOH", "TENDER_OFFER", "Mandatory Tender Offer", new Date("2026-10-02"), "KSEI-2"),
  );
});

test("unchanged source and facts does not create another alert", () => {
  const factsJson = JSON.stringify({ phase: "PROPOSED", newShares: 100, evidence: [{ exactQuote: "first wording" }] });
  assert.equal(changeType({ status: "CONFIRMED", contentFingerprint: "a", factsJson }, { status: "CONFIRMED", contentFingerprint: "a", factsJson }), null);
  assert.equal(changeType({ status: "CONFIRMED", contentFingerprint: "a", factsJson }, { status: "CONFIRMED", contentFingerprint: "b", factsJson: JSON.stringify({ phase: "PROPOSED", newShares: 100, evidence: [{ exactQuote: "changed wording" }] }) }), null);
});

test("proposed to approved and revised rights price produce substantive versions", () => {
  const proposed = { status: "PRELIMINARY" as const, contentFingerprint: "a", factsJson: JSON.stringify({ phase: "PROPOSED", exercisePriceIdr: null }) };
  const approved = { status: "CONFIRMED" as const, contentFingerprint: "b", factsJson: JSON.stringify({ phase: "APPROVED", exercisePriceIdr: 250 }) };
  assert.equal(changeType(proposed, approved), "PRELIMINARY_TO_CONFIRMED");
  assert.equal(changeType(approved, { ...approved, contentFingerprint: "c", factsJson: JSON.stringify({ phase: "APPROVED", exercisePriceIdr: 260 }) }), "FACTS_CHANGED");
});

test("deterministic financial ratios reject invalid denominators", () => {
  assert.equal(calculateDilution(900, 100), 10);
  assert.equal(calculateSizeToMarketCap(1_000_000, 4_000_000), 25);
  assert.equal(calculateDilution(0, 100), null);
  assert.equal(calculateSizeToMarketCap(1, 0), null);
  const score = scoreMateriality({ transactionIdr: 1_000_000, marketCapIdr: 4_000_000, dilutionPct: 10, changesControl: true, officialEvidence: true, genuinelyNew: true });
  assert.ok(score.score > 0 && score.score <= 100);
  assert.equal(score.priority, "HIGH");
});

test("invalid AI evidence and unsupported lifecycle are rejected", () => {
  const text = "BRNA The rights exercise price is Rp685. This is a proposal for approval.";
  const base = {
    ticker: "BRNA", category: "RIGHTS_ISSUE", title: "Rights issue", status: "CONFIRMED", phase: "PROPOSED", direction: "UNCERTAIN",
    summary: "Penawaran hak memesan efek telah diumumkan melalui dokumen resmi KSEI.",
    evidence: [{ claim: "Harga pelaksanaan Rp685", exactQuote: "The rights exercise price is Rp685." }],
    transactionIdr: null, newShares: null, existingShares: null, exercisePriceIdr: 685,
  };
  assert.equal(verifyResearch(base, text, "BRNA", "RIGHTS_ISSUE").ticker, "BRNA");
  assert.throws(() => verifyResearch({ ...base, evidence: [{ claim: "Invented", exactQuote: "price is Rp9999" }] }, text, "BRNA", "RIGHTS_ISSUE"));
  assert.throws(() => verifyResearch({ ...base, phase: "COMPLETED" }, text, "BRNA", "RIGHTS_ISSUE"));
  assert.throws(() => verifyResearch({ ...base, ticker: "ZZZZ" }, text, "BRNA", "RIGHTS_ISSUE"));
  assert.throws(() => verifyResearch({ ...base, announcementDate: "2026-10-06" }, text, "BRNA", "RIGHTS_ISSUE"), /date/);
  assert.throws(() => verifyResearch({ ...base, evidence: [{ claim: "Harga Rp999", exactQuote: "The rights exercise price is Rp685." }] }, text, "BRNA", "RIGHTS_ISSUE"), /claim number/);
  assert.throws(() => parseResearchResponse("{", text, "BRNA", "RIGHTS_ISSUE"), /invalid JSON/);
});

test("cron security requires a configured exact bearer secret", () => {
  const secret = "0123456789abcdef0123456789abcdef";
  assert.equal(cronAuthorized(`Bearer ${secret}`, secret), true);
  assert.equal(cronAuthorized(`Bearer ${secret}x`, secret), false);
  assert.equal(cronAuthorized("Bearer short", "short"), false);
  assert.equal(cronAuthorized(null, secret), false);
});

test("unreachable sources never become a clean scan", () => {
  assert.equal(deriveRunStatus({ failedAdapters: 1, errors: 0, pending: 0, sourceAdapters: 5, successfulAdapters: 4 }), "PARTIAL");
  assert.equal(deriveRunStatus({ failedAdapters: 5, errors: 0, pending: 0, sourceAdapters: 5, successfulAdapters: 0 }), "FAILED");
  assert.equal(deriveRunStatus({ failedAdapters: 0, errors: 0, pending: 1, sourceAdapters: 5, successfulAdapters: 5 }), "PARTIAL");
  assert.equal(deriveRunStatus({ failedAdapters: 0, errors: 0, pending: 0, sourceAdapters: 5, successfulAdapters: 5 }), "SUCCESS");
});
