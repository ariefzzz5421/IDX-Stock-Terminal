import Link from "next/link";
import { CompanyLogo } from "./CompanyLogo";
import { formatPrice, formatVolume } from "@/lib/format";
import type { TrendingStock } from "@/lib/market-data/trending";

export function MarketVolumeTape({ stocks }: { stocks: TrendingStock[]; demo?: boolean }) {
  if (!stocks.length) return null;
  return <div className="hidden border-t border-rule md:block">
    <div className="business-home-tape market-tape-window bg-rule" aria-label="Peringkat volume saham sesi terakhir, bergerak dari kiri ke kanan">
      <div className="market-tape-track">
        <div className="market-tape-group">{stocks.map((stock, index) => <TapeEntry key={stock.code} stock={stock} rank={index + 1} />)}</div>
        <div aria-hidden="true" className="market-tape-group">{stocks.map((stock, index) => <TapeEntry key={stock.code} stock={stock} rank={index + 1} duplicate />)}</div>
      </div>
    </div>
  </div>;
}

function TapeEntry({ stock, rank, duplicate = false }: { stock: TrendingStock; rank: number; duplicate?: boolean }) {
  return <Link href={`/asset/${stock.code}`} tabIndex={duplicate ? -1 : undefined} aria-label={duplicate ? undefined : `Buka ${stock.code}, peringkat volume ${rank}`} className="flex min-w-0 items-center gap-2 bg-panel px-3 py-2 hover:bg-panel-hi"><span className="shrink-0 font-display text-xs font-bold text-amber">#{rank}</span><CompanyLogo code={stock.code} logoUrl={stock.logoUrl} /><span className="min-w-0"><span className="block truncate text-xs font-bold text-cyan">{stock.code} <span className="font-normal text-ink">{stock.name}</span></span><span className="block truncate text-micro text-ink">{formatPrice(stock.lastPrice)} · Volume {formatVolume(stock.volume)}</span></span></Link>;
}
