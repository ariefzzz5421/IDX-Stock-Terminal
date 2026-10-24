# Market-data reliability (zero new paid dependencies)

This update hardens the existing IDX quote path; it does **not** promise that
a free third-party endpoint is licensed for redistribution or that prices are live.

## Runtime rules
- Select the real quote provider via `MARKET_DATA_PROVIDER=yahoo` (default).
- Opt in to an ordered backup list with `MARKET_DATA_FALLBACKS=goapi,itick`.
  Backup providers are skipped without their API credentials. Their mappings
  remain unverified against live accounts and must be tested before enabling.
- If every provider fails, show stored values labeled as saved/stale, or N/D.
  Never emit synthetic/mock prices in production.
- Each new quote passes ticker, nonnegative volume, finite-price, change,
  and timestamp sanity checks. This is **basic validation**, not a claim
  that the price has been independently verified.
- Yahoo provides an exchange quote timestamp when present. For providers
  that do not expose a verified trade timestamp, show `timestamp unverified`
  rather than pretending the fetch time is the execution time.
- Cached TradingView scanner data is a separate dashboard snapshot,
  not an independently confirmed real-time feed.
- `compareQuotes` is a pure helper for future cross-source checking; it only
  compares quotes with verified, comparable timestamps. Automated price voting
  is deliberately not enabled.

## Before enabling optional backups
1. Obtain your own permitted API key; do not bypass provider quotas.
2. Verify ticker coverage and response fields against the provider's current
   API docs using BBCA, BBRI and thinly traded IDX names.
3. Confirm permissions to display/redistribute each provider's data.
4. Inspect server logs for rejected quotes and test outages and 429 responses.
5. Watch latency and consumption under the free tier; disable a backup if its
   mapping or permissions are uncertain.

Run `node --import tsx --test tests/market-reliability.test.ts` for the pure
validation tests. No API key is required for the tests.
