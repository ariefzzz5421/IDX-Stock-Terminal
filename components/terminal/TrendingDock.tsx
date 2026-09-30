import { getMarketActivity } from "@/lib/market-data/trending";
import { TrendingPopup } from "./TrendingPopup";

export async function TrendingDock() {
  const activity = await getMarketActivity();
  return <TrendingPopup stocks={activity.byMarketCap.all} byMarketCap={activity.byMarketCap} />;
}
