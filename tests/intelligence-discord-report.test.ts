import assert from "node:assert/strict";
import test from "node:test";
import {
  formatWibDate, intelligenceReportFields, parseReportAnalysis, textForDiscord,
} from "../lib/alerts/intelligence-report";

test("formats an exact source date in WIB instead of the notification send time", () => {
  assert.equal(formatWibDate("2026-10-19T15:30:00+07:00"), "19 Oktober 2026");
  assert.match(formatWibDate(null), /belum diverifikasi/);
  assert.match(formatWibDate("not a date"), /tidak valid/);
});

test("resists invalid AI analysis and never fabricates absent details", () => {
  assert.deepEqual(parseReportAnalysis("{ invalid"), {});
  assert.deepEqual(parseReportAnalysis('["not an object"]'), {});
  assert.deepEqual(parseReportAnalysis('{"whatChanged":"Disclosed","marketImpact":3}'), { whatChanged: "Disclosed" });
  const fields = intelligenceReportFields({ announcementAt: null });
  assert.match(fields.find((f) => f.name === "Tanggal pengumuman")?.value ?? "", /belum diverifikasi/);
  assert.equal(fields.find((f) => f.name === "Apa yang berubah")?.value, "N/D");
});

test("sanitizes mass mentions and backticks from untrusted disclosure text", () => {
  const input = "@everyone moved " + String.fromCharCode(96) + "code" + String.fromCharCode(96);
  const cleaned = textForDiscord(input, 100);
  assert.equal(cleaned.includes("@everyone"), false);
  assert.equal(cleaned.includes(String.fromCharCode(96)), false);
  assert.equal(textForDiscord("", 5), "N/D");
});

test("report format contains source-dated change, materiality, market impact and monitoring", () => {
  const fields = intelligenceReportFields({
    announcementAt: "2026-10-19T08:00:00+07:00",
    effectiveAt: "2026-10-20T08:00:00+07:00",
    whatChanged: "Rights price finalized",
    materiality: "Potential dilution",
    marketImpact: "Mixed; no price guarantee",
    monitorNext: "Subscription results",
  });
  assert.equal(fields[0]?.value, "19 Oktober 2026");
  assert.equal(fields[1]?.value, "20 Oktober 2026");
  assert.equal(fields.find((f) => f.name === "Perkiraan dampak pasar")?.value, "Mixed; no price guarantee");
  assert.equal(fields.find((f) => f.name === "Hal yang perlu dipantau")?.value, "Subscription results");
});
