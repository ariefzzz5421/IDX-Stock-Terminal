import { isResearchAdmin } from "@/lib/intelligence/access";
import { previewIntradayAlerts } from "@/lib/alerts/intraday";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  if (!await isResearchAdmin()) return Response.json({error:"Forbidden"},{status:403});
  try {return Response.json(await previewIntradayAlerts(),{headers:{"Cache-Control":"private, no-store"}});}
  catch {return Response.json({error:"Market preview unavailable"},{status:503});}
}
