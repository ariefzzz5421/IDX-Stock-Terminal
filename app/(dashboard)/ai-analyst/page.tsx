import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { createMarketBrief, getAnalystProvider } from "@/lib/ai-analyst";
import { getMarketActivity } from "@/lib/market-data/trending";
import { AiAnalystPanel } from "@/components/terminal/AiAnalystPanel";

export const metadata: Metadata = { title: "AI Analyst — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function AiAnalystPage() {
  await requireUser();
  const brief = createMarketBrief(await getMarketActivity());
  return <AiAnalystPanel initial={brief} configured={Boolean(getAnalystProvider())} />;
}
