import "server-only";
import { isDiscordWebhookUrl, safeHttpsUrl } from "./rules";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { marketCapText } from "./market-rules";

type EventMessage = {
  title: string;
  summary: string;
  category: string;
  priority: string;
  status: string;
  changeType: string;
  sourceUrl: string;
  eventId: string;
  codes: string[];
};

const preventMentions = (value: string) =>
  value.replace(/@/g, "@\u200b").replace(/\u0060/g, "'").trim();

export function eventEmbed(event: EventMessage) {
  const source = safeHttpsUrl(event.sourceUrl);
  const ticker = event.codes.length ? event.codes.join(", ") : "Unknown";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://idx-stock-terminal.vercel.app";
  const deepLink = new URL("/ai-analyst/research/" + encodeURIComponent(event.eventId), base);
  return {
    title: ("IDX · " + preventMentions(event.title)).slice(0, 256),
    description: preventMentions(event.summary).slice(0, 3900),
    url: deepLink.toString(),
    color: event.priority === "CRITICAL" ? 0xef4444 : event.priority === "HIGH" ? 0xf59e0b : 0x38bdf8,
    fields: [
      { name: "Ticker", value: preventMentions(ticker).slice(0, 1024), inline: true },
      { name: "Market cap (reference)", value: event.codes.map(code => code + ": " + marketCapText(getCompanyCatalogEntry(code)?.marketCap ?? null)).join("\n").slice(0, 1024) || "N/D", inline: false },
      { name: "Priority", value: event.priority, inline: true },
      { name: "Verification", value: event.status, inline: true },
      { name: "Category", value: preventMentions(event.category), inline: true },
      { name: "Change", value: preventMentions(event.changeType), inline: true },
      { name: "Official source", value: source ? "[Read source document](" + source + ")" : "URL unavailable", inline: false },
    ],
    footer: { text: "MCap from stored issuer catalog, may be stale · Not a trading signal" },
    timestamp: new Date().toISOString(),
  };
}

export type WebhookOutcome =
  | { ok: true }
  | { ok: false; error: string; permanent: boolean; retryAfterMs: number };

export async function sendDiscordEmbed(embed: ReturnType<typeof eventEmbed> | Record<string, unknown>, target: "primary" | "market" = "primary"): Promise<WebhookOutcome> {
  const url = (target === "market" ? process.env.DISCORD_MARKET_WEBHOOK_URL?.trim() || process.env.DISCORD_WEBHOOK_URL?.trim() : process.env.DISCORD_WEBHOOK_URL?.trim()) ?? "";
  if (!isDiscordWebhookUrl(url)) {
    return { ok: false, error: "Missing or invalid DISCORD_WEBHOOK_URL", permanent: true, retryAfterMs: 0 };
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "IDX Stock Terminal",
        allowed_mentions: { parse: [] },
        embeds: [embed],
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (response.ok) return { ok: true };
    const retryHeader = Number(response.headers.get("retry-after") ?? "0");
    const retryAfterMs = Number.isFinite(retryHeader) && retryHeader > 0 ? Math.ceil(retryHeader * 1000) : 0;
    return {
      ok: false,
      error: "Discord responded with HTTP " + response.status,
      permanent: response.status >= 400 && response.status < 500 && response.status !== 429,
      retryAfterMs,
    };
  } catch {
    // Do not log or expose the webhook URL, tokens, or provider response body.
    return { ok: false, error: "Discord network request failed or timed out", permanent: false, retryAfterMs: 0 };
  }
}
