import { handleResearchCron } from "@/lib/intelligence/cron-handler";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Legacy authenticated endpoint; the deployment schedule uses named sessions.
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  return handleResearchCron(request, hour < 15 ? "morning" : "evening");
}
