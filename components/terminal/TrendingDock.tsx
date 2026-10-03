import { cookies } from "next/headers";
import { getMarketActivity } from "@/lib/market-data/trending";
import { TRENDING_DOCK_COOKIE, TRENDING_EXTENSION_COOKIE } from "@/lib/trending-extension";
import { TrendingPopup } from "./TrendingPopup";

export async function TrendingDock() {
  const cookieStore = await cookies();
  if (cookieStore.get(TRENDING_EXTENSION_COOKIE)?.value !== "on") return null;
  const activity = await getMarketActivity();
  return <TrendingPopup stocks={activity.byMarketCap.all} byMarketCap={activity.byMarketCap} initialMinimized={cookieStore.get(TRENDING_DOCK_COOKIE)?.value === "minimized"} />;
}
