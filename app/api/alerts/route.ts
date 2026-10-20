import { isResearchAdmin } from "@/lib/intelligence/access";
import {
  updateAlertSettings, updateMarketSettings, sendDiscordTest, retryDiscordAlerts,
} from "@/lib/alerts/store";
import { retryMarketDeliveries } from "@/lib/alerts/market";
import { sendIntradayPreviewTest, runIntradayAlertsSafely } from "@/lib/alerts/intraday";
import { PRIORITIES, type AlertPriority } from "@/lib/alerts/rules";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function validOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

async function guard(request: Request): Promise<Response | null> {
  if (!await isResearchAdmin()) return Response.json({ error: "Admin access required. Set AI_ANALYST_ADMIN_USERNAMES." }, { status: 403 });
  if (!validOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  return null;
}

export async function PATCH(request: Request) {
  const rejected = await guard(request);
  if (rejected) return rejected;
  const input = await request.json().catch(() => null) as null | {
    scope?:unknown; enabled?: unknown; minimumPriority?: unknown; includePreliminary?: unknown;
    marketVolumeEnabled?:unknown; marketAraEnabled?:unknown; marketArbEnabled?:unknown; marketTopCount?:unknown;
  };
  if (input?.scope === "market") {
    if (typeof input.marketVolumeEnabled !== "boolean" || typeof input.marketAraEnabled !== "boolean" ||
        typeof input.marketArbEnabled !== "boolean" || input.marketTopCount !== 10) {
      return Response.json({error:"Invalid market settings"}, {status:400});
    }
    try {
      const settings = await updateMarketSettings({
        marketVolumeEnabled:input.marketVolumeEnabled, marketAraEnabled:input.marketAraEnabled,
        marketArbEnabled:input.marketArbEnabled, marketTopCount:10,
      });
      return Response.json({ok:true, settings:{marketVolumeEnabled:settings.marketVolumeEnabled,
        marketAraEnabled:settings.marketAraEnabled,marketArbEnabled:settings.marketArbEnabled,marketTopCount:10}});
    } catch {return Response.json({error:"Unable to save market alert settings"},{status:503});}
  }
  if (!input || typeof input.enabled !== "boolean" ||
      typeof input.includePreliminary !== "boolean" ||
      typeof input.minimumPriority !== "string" ||
      !PRIORITIES.includes(input.minimumPriority as AlertPriority)) {
    return Response.json({ error: "Invalid alert configuration" }, { status: 400 });
  }
  try {
    const saved = await updateAlertSettings({
      enabled: input.enabled,
      includePreliminary: input.includePreliminary,
      minimumPriority: input.minimumPriority as AlertPriority,
    });
    return Response.json({ ok: true, settings: {
      enabled: saved.enabled, minimumPriority: saved.minimumPriority,
      includePreliminary: saved.includePreliminary,
    } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[alerts] unable to update settings", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Could not save configuration. Check database migrations." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const rejected = await guard(request);
  if (rejected) return rejected;
  const input = await request.json().catch(() => null) as { action?: unknown } | null;
  if (!["test","retry","market-test","market-scan"].includes(String(input?.action))) {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }
  try {
    const action = input?.action;
    const result = action === "test" ? await sendDiscordTest()
      : action === "market-test" ? await sendIntradayPreviewTest()
      : action === "market-scan" ? await runIntradayAlertsSafely()
      : { ...(await retryDiscordAlerts()), market: await retryMarketDeliveries() };
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Alert request failed";
    // Only predictable, non-sensitive messages are returned to browsers.
    if (message.includes("60 seconds")) return Response.json({ error: message }, { status: 429 });
    if (message.startsWith("Configure DISCORD_")) return Response.json({ error: message }, { status: 503 });
    console.error("[alerts] action failed", message);
    return Response.json({ error: "Action failed. Check migrations, Vercel logs and Discord connection." }, { status: 503 });
  }
}
