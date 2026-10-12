import type { Metadata } from "next";
import { isGuest, requireUser } from "@/lib/auth/session";
import { createMarketBrief, getAnalystProvider } from "@/lib/ai-analyst";
import { getMarketActivity } from "@/lib/market-data/trending";
import { AiAnalystPanel } from "@/components/terminal/AiAnalystPanel";
import { CorporateIntelligence } from "@/components/terminal/CorporateIntelligence";
import { syncNotifications } from "@/lib/intelligence/queries";

export const metadata: Metadata = { title: "AI Analyst — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function AiAnalystPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const search = await searchParams;
  const get = (key: string) => { const value = search[key]; return typeof value === "string" ? value : undefined; };
  const researchPage = Number(get("page") || 1);
  if (!isGuest(user)) await syncNotifications(user.id);
  const brief = createMarketBrief(await getMarketActivity());
  return <div className="min-w-0 flex-1"><CorporateIntelligence userId={user.id} researchPage={researchPage} historyPage={Number(get("historyPage") || 1)} period={get("period")} /><AiAnalystPanel initial={brief} configured={Boolean(getAnalystProvider())} /></div>;
}
