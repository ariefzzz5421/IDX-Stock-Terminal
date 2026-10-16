import { isResearchAdmin } from "@/lib/intelligence/access";
import {
  updateAlertSettings, sendDiscordTest, retryDiscordAlerts,
} from "@/lib/alerts/store";
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
    enabled?: unknown; minimumPriority?: unknown; includePreliminary?: unknown;
  };
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
  if (input?.action !== "test" && input?.action !== "retry") {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }
  try {
    const result = input.action === "test" ? await sendDiscordTest() : await retryDiscordAlerts();
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Alert request failed";
    // Only predictable, non-sensitive messages are returned to browsers.
    if (message.includes("60 seconds")) return Response.json({ error: message }, { status: 429 });
    if (message.startsWith("Configure DISCORD_WEBHOOK_URL")) return Response.json({ error: message }, { status: 503 });
    console.error("[alerts] action failed", message);
    return Response.json({ error: "Action failed. Check migrations, Vercel logs and Discord connection." }, { status: 503 });
  }
}
