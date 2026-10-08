import assert from "node:assert/strict";
import test from "node:test";
import { calculateDilution, calculateSizeToMarketCap, changeType, deriveRunStatus, eventIdentity, matchTickers, scoreMateriality } from "../lib/intelligence/core";
import { parseResearchResponse, verifyResearch } from "../lib/intelligence/validation";
import { cronAuthorized } from "../lib/intelligence/security";
import { runOutcome, scanHeadline } from "../lib/intelligence/scan-presentation";
import { scheduledSlot, sessionLabel } from "../lib/intelligence/schedule";
import { selectDailyTrading } from "../lib/market-data/daily-trading";
import type { Quote } from "../lib/market-data/types";
import { parseKseiDate } from "../lib/intelligence/source-date";

test("KSEI source dates retain the real Indonesian publication day", () => {
  assert.equal(parseKseiDate("07 Oktober 2026")?.toISOString(), "2026-10-07T05:00:00.000Z");
  assert.equal(parseKseiDate("06 October 2026")?.toISOString(), "2026-10-06T05:00:00.000Z");
  assert.equal(parseKseiDate("32 Oktober 2026"), null);
});

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

test("a clean no-news message requires a successful scan on the current Jakarta day", () => {
  const now = new Date("2026-10-07T14:00:00.000Z");
  const run = { status: "SUCCESS", endedAt: new Date("2026-10-07T13:05:00.000Z"), newEvents: 0, updatedEvents: 0 };
  assert.match(scanHeadline(run, now), /Tidak ada temuan material baru/);
  assert.match(scanHeadline({ ...run, endedAt: new Date("2026-10-06T13:05:00.000Z") }, now), /Belum ada pemindaian berhasil hari ini/);
  assert.doesNotMatch(scanHeadline({ ...run, status: "PARTIAL" }, now), /Tidak ada temuan material baru/);
  assert.doesNotMatch(scanHeadline({ ...run, status: "FAILED" }, now), /Tidak ada temuan material baru/);
  assert.doesNotMatch(scanHeadline({ ...run, status: "RUNNING" }, now), /Tidak ada temuan material baru/);
});

test("weekday morning and evening scans have distinct idempotent Jakarta slots", () => {
  const morning = new Date("2026-10-07T01:20:00.000Z");
  const duplicate = new Date("2026-10-07T01:55:00.000Z");
  const evening = new Date("2026-10-07T14:20:00.000Z");
  assert.equal(scheduledSlot(morning, "morning"), "scheduled:2026-10-07:morning");
  assert.equal(scheduledSlot(morning, "morning"), scheduledSlot(duplicate, "morning"));
  assert.equal(scheduledSlot(evening, "evening"), "scheduled:2026-10-07:evening");
  assert.notEqual(scheduledSlot(morning, "morning"), scheduledSlot(evening, "evening"));
  assert.match(sessionLabel(scheduledSlot(morning, "morning")), /Pagi/);
});

test("scan history never labels partial or failed runs as no news", () => {
  const base = { endedAt: new Date(), newEvents: 0, updatedEvents: 0 };
  assert.match(runOutcome({ ...base, status: "SUCCESS" }), /Tidak ada temuan/);
  assert.doesNotMatch(runOutcome({ ...base, status: "PARTIAL" }), /Tidak ada temuan/);
  assert.doesNotMatch(runOutcome({ ...base, status: "FAILED" }), /Tidak ada temuan/);
});

test("daily volume selects dated exact BEI data or clearly estimated provider fallback", () => {
  const quote: Quote = { code: "TLKM", price: 2280, prevClose: 2300, change: -20, changePct: -0.87, open: 2300, high: 2320, low: 2260, volume: 162_461_500, value: 162_461_500 * 2280, timestamp: Date.parse("2026-10-06T09:14:40Z") };
  const official = { date: "2026-10-06", volume: 162_461_500, value: 369_000_000_000 };
  assert.deepEqual(selectDailyTrading(official, quote, "yahoo"), { date: "2026-10-06", volume: 162_461_500, value: 369_000_000_000, source: "BEI · Ringkasan Saham", estimatedValue: false });
  const yahoo = selectDailyTrading({ ...official, date: "2026-10-05" }, quote, "yahoo");
  assert.equal(yahoo.volume, 162_461_500);
  assert.equal(yahoo.estimatedValue, true);
  assert.equal(yahoo.date, "2026-10-06");
  assert.equal(selectDailyTrading(null, { ...quote, volumeAvailable: false }, "yahoo").volume, null);
  assert.equal(selectDailyTrading(null, quote, "mock").volume, null);
});
