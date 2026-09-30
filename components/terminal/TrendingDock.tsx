import { getTrendingStocks } from "@/lib/market-data/trending";
import { TrendingPopup } from "./TrendingPopup";

export async function TrendingDock() {
  return <TrendingPopup stocks={await getTrendingStocks()} />;
}
