import { handleResearchCron } from "@/lib/intelligence/cron-handler";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleResearchCron(request, "morning");
}
