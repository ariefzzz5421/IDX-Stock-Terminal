import assert from "node:assert/strict";
import test from "node:test";
import {
  eligiblePriorities, isAlertEligible, nextRetryDelayMs, safeHttpsUrl, isDiscordWebhookUrl,
} from "../lib/alerts/rules";

test("CRITICAL and HIGH are enabled by default, but MEDIUM and WATCH are not", () => {
  assert.deepEqual(eligiblePriorities("HIGH"), ["CRITICAL", "HIGH"]);
  assert.equal(isAlertEligible("HIGH", "CONFIRMED", "HIGH", false), true);
  assert.equal(isAlertEligible("CRITICAL", "CONFIRMED", "HIGH", false), true);
  assert.equal(isAlertEligible("MEDIUM", "CONFIRMED", "HIGH", false), false);
  assert.equal(isAlertEligible("HIGH", "PRELIMINARY", "HIGH", false), false);
  assert.equal(isAlertEligible("HIGH", "PRELIMINARY", "HIGH", true), true);
  assert.equal(isAlertEligible("HIGH", "UNCONFIRMED", "HIGH", true), false);
  assert.equal(isAlertEligible("HIGH", "SUPERSEDED", "HIGH", true), false);
});

test("retry backoff increases exponentially, and honors rate limit", () => {
  assert.equal(nextRetryDelayMs(1), 60_000);
  assert.equal(nextRetryDelayMs(2), 120_000);
  assert.equal(nextRetryDelayMs(2, 300_000), 300_000);
  assert.equal(nextRetryDelayMs(50), 6 * 60 * 60_000);
});

test("only HTTPS source URLs and official Discord webhook host are accepted", () => {
  assert.equal(safeHttpsUrl("javascript:alert(1)"), null);
  assert.equal(safeHttpsUrl("http://ksei.co.id/file.pdf"), null);
  assert.equal(safeHttpsUrl("https://www.ksei.co.id/file.pdf"), "https://www.ksei.co.id/file.pdf");
  assert.equal(isDiscordWebhookUrl("https://discord.com/api/webhooks/12345678/abcDEF_123"), true);
  assert.equal(isDiscordWebhookUrl("https://discord.com.evil.tld/api/webhooks/12345/abc"), false);
  assert.equal(isDiscordWebhookUrl("http://discord.com/api/webhooks/12345/abc"), false);
});
