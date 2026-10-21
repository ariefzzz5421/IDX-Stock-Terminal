import { cronAuthorized } from "@/lib/intelligence/security";
import { runScheduledMarketAlertsSafely } from "@/lib/alerts/intraday";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// For the user's VPS / external scheduler; deliberately NOT a Vercel Hobby cron.
export async function POST(request: Request) {
  if (!cronAuthorized(request.headers.get("authorization"), process.env.MARKET_ALERT_SECRET)) {
    return Response.json({error:"Unauthorized"}, {status:401});
  }
  const result = await runIntradayAlertsSafely();
  return Response.json(result,{headers:{"Cache-Control":"no-store"}});
}
