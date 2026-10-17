// One-shot VPS worker. Invoke at :00 and :05 during trading hours. Backend enforces active sessions and dedupe.
// No Discord webhook URL is needed on the VPS.
const base = process.env.IDX_TERMINAL_URL ?? "https://idx-stock-terminal.vercel.app";
const secret = process.env.MARKET_ALERT_SECRET ?? "";
if (secret.length < 32 || !base.startsWith("https://")) {
  console.error("IDX_TERMINAL_URL must be HTTPS and MARKET_ALERT_SECRET must be 32+ characters.");
  process.exit(1);
}
const url = new URL("/api/alerts/market/scan", base);
try {
  const response = await fetch(url, {
    method: "POST", headers: {Authorization: "Bearer " + secret},
    signal: AbortSignal.timeout(50_000),
  });
  console.log("Market scan HTTP", response.status, (await response.text()).slice(0, 350));
  if (!response.ok) process.exitCode = 1;
} catch {
  console.error("Market scan request failed");
  process.exitCode = 1;
}
