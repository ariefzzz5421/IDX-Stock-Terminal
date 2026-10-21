import "server-only";
import { isDiscordWebhookUrl, safeHttpsUrl } from "./rules";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { marketCapText } from "./market-rules";
import { intelligenceReportFields, parseReportAnalysis, textForDiscord } from "./intelligence-report";

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
  analysisJson?: string | null;
  announcementAt?: Date | null;
  effectiveAt?: Date | null;
  publishedAt?: Date | null;
  direction?: string | null;
};

const preventMentions = (value: string) =>
  value.replace(/@/g, "@\u200b").replace(/\u0060/g, "'").trim();

export function eventEmbed(event: EventMessage) {
  const source = safeHttpsUrl(event.sourceUrl);
  const ticker = event.codes.length ? event.codes.join(", ") : "N/D";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://idx-stock-terminal.vercel.app";
  const deepLink = new URL("/ai-analyst/research/" + encodeURIComponent(event.eventId), base);
  const analysis = parseReportAnalysis(event.analysisJson);
  const detailFields = intelligenceReportFields({
    ...analysis,
    announcementAt: event.announcementAt,
    effectiveAt: event.effectiveAt,
    publishedAt: event.publishedAt,
    direction: event.direction,
  });
  const verification = event.status === "PRELIMINARY"
    ? "INDIKASI AWAL — belum final, perlu konfirmasi lanjutan."
    : "CONFIRMED — fakta dalam dokumen sumber; bukan berarti transaksi telah selesai.";
  return {
    title: ("IDX Material Intelligence · " + preventMentions(event.title)).slice(0, 256),
    description: (textForDiscord(event.summary, 1000) + "\n\n" + verification).slice(0, 1200),
    url: deepLink.toString(),
    color: event.priority === "CRITICAL" ? 0xef4444 : event.priority === "HIGH" ? 0xf59e0b : 0x38bdf8,
    fields: [
      { name: "Ticker / kategori", value: textForDiscord(ticker + " · " + event.category.replaceAll("_", " "), 400), inline: false },
      { name: "Prioritas / verifikasi", value: event.priority + " · " + event.status, inline: true },
      { name: "Delta", value: textForDiscord(event.changeType, 80), inline: true },
      ...detailFields,
      { name: "Arah dampak", value: textForDiscord(event.direction ?? "UNCERTAIN", 50), inline: true },
      { name: "Market cap (referensi)", value: textForDiscord(event.codes.map(code => code + ": " + marketCapText(getCompanyCatalogEntry(code)?.marketCap ?? null)).join("\n"), 900), inline: false },
      { name: "Sumber asli", value: source ? "[Buka keterbukaan sumber](" + source + ")" : "Dokumen sumber tidak tersedia", inline: false },
    ],
    footer: { text: "Hanya sumber yang berhasil diproses · market cap katalog bisa tertunda · bukan rekomendasi investasi" },
    timestamp: new Date().toISOString(),
  };
}

export type WebhookOutcome =
  | { ok: true }
  | { ok: false; error: string; permanent: boolean; retryAfterMs: number };

export async function sendDiscordEmbed(embed: ReturnType<typeof eventEmbed> | Record<string, unknown>, target: "primary" | "market" = "primary"): Promise<WebhookOutcome> {
  const url = (target === "market"
    ? process.env.DISCORD_MARKET_WEBHOOK_URL?.trim() || process.env.DISCORD_WEBHOOK_URL?.trim()
    : process.env.DISCORD_INTELLIGENCE_WEBHOOK_URL?.trim() || process.env.DISCORD_WEBHOOK_URL?.trim()) ?? "";
  if (!isDiscordWebhookUrl(url)) {
    return { ok: false, error: "Missing or invalid Discord webhook URL", permanent: true, retryAfterMs: 0 };
  }
  try {
    // _marketRows is internal data, never a Discord embed field.
    const { _marketRows, ...cleanEmbed } = embed as Record<string, unknown>;
    if (target === "market") {
      // Sent time, not stale scanner observation time. Keep corporate alerts
      // untouched. Strip legacy long footers even from queued older payloads.
      delete cleanEmbed.footer;
      cleanEmbed.timestamp = new Date().toISOString();
    }
    let payload: Record<string, unknown> = {
      username: "IDX Stock Terminal",
      allowed_mentions: { parse: [] },
      embeds: [cleanEmbed],
    };
    let body: BodyInit = JSON.stringify(payload);
    let headers: HeadersInit | undefined = { "Content-Type": "application/json" };

    if (target === "market" && Array.isArray(_marketRows) && _marketRows.length > 0) {
      // Discord embeds cannot place one logo beside every text row; attach a
      // generated PNG alongside the fully readable text embed. Image failure
      // must not prevent the text notification from being delivered.
      try {
        const { renderMarketCard } = await import("./market-card");
        const verified = _marketRows.slice(0,10).filter((row: unknown) => {
          if (!row || typeof row !== "object") return false;
          const v = row as Record<string, unknown>;
          return typeof v.code === "string" && /^[A-Z0-9]{4,6}$/.test(v.code) &&
            typeof v.lastPrice === "number" && Number.isFinite(v.lastPrice) &&
            typeof v.volume === "number" && Number.isFinite(v.volume) &&
            typeof v.changePct === "number" && Number.isFinite(v.changePct);
        });
        if (verified.length > 0) {
          const bytes = await renderMarketCard(String(cleanEmbed.title ?? "IDX Market"),
            verified as Parameters<typeof renderMarketCard>[1]);
          const filename = "idx-market-card.png";
          payload = { ...payload, embeds: [{ ...cleanEmbed,
            image: { url: "attachment://" + filename } }] };
          const form = new FormData();
          form.append("payload_json", JSON.stringify(payload));
          form.append("files[0]", new Blob([new Uint8Array(bytes)], {type:"image/png"}), filename);
          body = form;
          headers = undefined;
        }
      } catch (error) {
        console.warn("[alerts] image card unavailable; using text embed",
          error instanceof Error ? error.name : "unknown");
      }
    }
    const response = await fetch(url, {
      method: "POST",
      ...(headers ? {headers} : {}),
      body,
      signal: AbortSignal.timeout(15_000),
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
