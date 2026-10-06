import { isResearchAdmin } from "@/lib/intelligence/access";
import { runResearch } from "@/lib/intelligence/pipeline";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!await isResearchAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { dryRun?: boolean };
  try {
    const result = await runResearch({ dryRun: body.dryRun === true, scheduled: false });
    return Response.json(result, { status: result.status === "FAILED" ? 503 : 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Scan failed" }, { status: 409 });
  }
}
