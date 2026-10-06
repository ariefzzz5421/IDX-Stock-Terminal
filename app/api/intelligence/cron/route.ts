import { cronAuthorized } from "@/lib/intelligence/security";
import { runResearch } from "@/lib/intelligence/pipeline";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || process.env.CRON_SECRET.length < 32) return Response.json({ error: "Cron not configured" }, { status: 503 });
  if (!cronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await runResearch({ dryRun: false, scheduled: true });
    return Response.json(result, { status: result.status === "FAILED" ? 503 : 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    if ((error as { code?: string }).code === "P2002") return Response.json({ status: "ALREADY_RAN", message: "Scheduled scan already recorded for this WIB day." }, { headers: { "Cache-Control": "no-store" } });
    return Response.json({ error: message }, { status: message.includes("already running") ? 409 : 503 });
  }
}
