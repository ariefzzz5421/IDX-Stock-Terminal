import type { Metadata } from "next";
import { isGuest, requireUser } from "@/lib/auth/session";
import { createMarketBrief, getAnalystProvider } from "@/lib/ai-analyst";
import { getMarketActivity } from "@/lib/market-data/trending";
import { AiAnalystPanel } from "@/components/terminal/AiAnalystPanel";
import { CorporateIntelligence } from "@/components/terminal/CorporateIntelligence";
import { syncNotifications, type ResearchFilters } from "@/lib/intelligence/queries";

export const metadata: Metadata = { title: "AI Analyst — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function AiAnalystPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const search = await searchParams;
  const get = (key: string) => { const value = search[key]; return typeof value === "string" ? value : undefined; };
  const many = (key: string) => { const value = search[key]; return Array.isArray(value) ? value : typeof value === "string" && value ? [value] : undefined; };
  const filters: ResearchFilters = {
    q: get("q"), ticker: get("ticker"), categories: many("category"),
    priorities: many("priority"), statuses: many("status"),
    directions: many("direction"), from: get("from"),
    latest: get("latest") === "1", watchlist: get("watchlist") === "1",
    sort: get("sort") === "oldest" || get("sort") === "priority" ? get("sort") as "oldest" | "priority" : "newest",
    page: Number(get("page") || 1),
  };
  if (!isGuest(user)) await syncNotifications(user.id);
  const brief = createMarketBrief(await getMarketActivity());
  return <div className="min-w-0 flex-1"><CorporateIntelligence userId={user.id} filters={filters} historyPage={Number(get("historyPage") || 1)} /><AiAnalystPanel initial={brief} configured={Boolean(getAnalystProvider())} /></div>;
}
