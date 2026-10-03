import { cookies } from "next/headers";
import { getMarketActivity } from "@/lib/market-data/trending";
import { withMarketSnapshot } from "@/lib/market-data/boards";
import { watchlistRows } from "@/lib/stocks";
import { VOLUME_EXTENSION_COOKIE, WATCHLIST_EXTENSION_COOKIE } from "@/lib/mobile-extensions";
import { MobileStockPanel } from "./MobileStockPanel";
import type { StockRow } from "./StockTable";

export async function MobileExtensionDock({ userId }: { userId: string }) {
  const cookieStore = await cookies();
  const watchlistOn = cookieStore.get(WATCHLIST_EXTENSION_COOKIE)?.value === "on";
  const volumeOn = cookieStore.get(VOLUME_EXTENSION_COOKIE)?.value === "on";
  if (!watchlistOn && !volumeOn) return null;
  const [activity, watchlist] = await Promise.all([getMarketActivity(), watchlistOn ? watchlistRows(userId) : Promise.resolve([])]);
  const volumeRows: StockRow[] = activity.byVolume.map((stock) => ({
    code: stock.code, name: stock.name, logoUrl: stock.logoUrl,
    sector: null, lastPrice: stock.lastPrice, lastChangePct: stock.changes.day,
    lastVolume: stock.volume, lastValue: stock.turnover, marketCap: stock.marketCap,
  }));
  return <>
    {watchlistOn && <MobileStockPanel title="Pantauan" description="Saham yang kamu simpan" rows={withMarketSnapshot(watchlist, activity)} icon="star" offset="top-[32%]" />}
    {volumeOn && <MobileStockPanel title="Volume sesi terakhir" description="Urut berdasarkan jumlah lembar saham pada snapshot pasar" rows={volumeRows} icon="volume" offset="top-[68%]" />}
  </>;
}
