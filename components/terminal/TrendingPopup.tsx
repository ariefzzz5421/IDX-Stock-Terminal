"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp, Flame, SlidersHorizontal } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import { directionClass, formatPct, formatPrice, formatValue } from "@/lib/format";
import type { MarketCapFilter, TrendingStock } from "@/lib/market-data/trending";

type Timeframe = keyof TrendingStock["changes"];
type Props = {
  stocks: TrendingStock[];
  byMarketCap?: Record<MarketCapFilter, TrendingStock[]>;
  demo?: boolean;
};

const CAP_OPTIONS: Array<{ value: MarketCapFilter; label: string }> = [
  { value: "all", label: "Semua cap" },
  { value: "gt100t", label: "> Rp100T" },
  { value: "gt50t", label: "> Rp50T" },
  { value: "gt10t", label: "> Rp10T" },
  { value: "gt1t", label: "> Rp1T" },
  { value: "under1t", label: "< Rp1T" },
];

function matchesCap(stock: TrendingStock, filter: MarketCapFilter) {
  const cap = stock.marketCap;
  if (filter === "all") return true;
  if (cap === null) return false;
  if (filter === "gt100t") return cap > 100e12;
  if (filter === "gt50t") return cap > 50e12;
  if (filter === "gt10t") return cap > 10e12;
  if (filter === "gt1t") return cap > 1e12;
  return cap < 1e12;
}

export function TrendingPopup({ stocks, byMarketCap, demo = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("day");
  const [capFilter, setCapFilter] = useState<MarketCapFilter>("all");

  const visible = byMarketCap?.[capFilter] ?? stocks.filter((stock) => matchesCap(stock, capFilter));

  return <aside aria-label="Top 10 saham aktif" className="fixed bottom-3 right-3 z-40 w-[min(24rem,calc(100dvw-1.5rem))] border border-rule-hi bg-panel shadow-[0_12px_42px_#0009] sm:bottom-5 sm:right-5">
    <div className="flex items-center gap-2 bg-panel-hi px-3 py-2">
      <Flame aria-hidden="true" className="h-4 w-4 text-amber" />
      <div className="min-w-0 flex-1"><div className="font-display text-xs font-bold uppercase tracking-widest text-amber">Top 10 trending</div><div className="truncate text-micro text-dim">{demo ? "Contoh data · bukan harga pasar" : "Peringkat nilai transaksi · data tertunda"}</div></div>
      <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-label={expanded ? "Minimalkan panel trending" : "Buka panel trending"} className="grid h-9 w-9 place-items-center border border-rule text-ink hover:text-amber">{expanded ? <ChevronDown aria-hidden="true" className="h-4 w-4" /> : <ChevronUp aria-hidden="true" className="h-4 w-4" />}</button>
    </div>
    {expanded && <div>
      <div className="grid grid-cols-2 gap-2 border-y border-rule px-3 py-2 text-micro text-dim">
        <label className="min-w-0"><span className="mb-1 flex items-center gap-1"><SlidersHorizontal aria-hidden="true" className="h-3 w-3" /> Market cap</span><select value={capFilter} onChange={(event) => setCapFilter(event.target.value as MarketCapFilter)} aria-label="Filter market cap trending" className="min-h-9 w-full border border-rule bg-void px-2 text-xs text-ink">{CAP_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="min-w-0"><span className="mb-1 block">Time frame</span><select value={timeframe} onChange={(event) => setTimeframe(event.target.value as Timeframe)} aria-label="Pilih time frame perubahan harga" className="min-h-9 w-full border border-rule bg-void px-2 text-xs text-ink"><option value="day">1 hari</option><option value="week">1 minggu</option><option value="month">1 bulan</option></select></label>
      </div>
      {visible.length ? <ol className="max-h-[min(27rem,55vh)] overflow-y-auto">{visible.map((stock, index) => <li key={stock.code} className="border-b border-rule/50 last:border-0"><Link href={`/asset/${stock.code}`} className="flex min-w-0 items-center gap-2 px-3 py-2 hover:bg-panel-hi"><span className="w-6 shrink-0 text-right text-micro tabular-nums text-amber">#{index + 1}</span><CompanyLogo code={stock.code} logoUrl={stock.logoUrl} /><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-ink-hi">{stock.code}</span><span className="block truncate text-micro text-dim" title={stock.name}>{stock.name}</span><span className="block text-micro text-dimmer">Cap {formatValue(stock.marketCap)}</span></span><span className="text-right"><span className={`block text-xs font-bold tabular-nums ${directionClass(stock.changes[timeframe])}`}>{formatPct(stock.changes[timeframe])}</span><span className="block text-micro tabular-nums text-dim">{formatPrice(stock.lastPrice)}</span><span className="block text-micro tabular-nums text-dimmer">{formatValue(stock.turnover)}</span></span></Link></li>)}</ol> : <p className="p-4 text-xs text-dim">Tidak ada saham dengan data transaksi dan market cap pada filter ini.</p>}
      <p className="border-t border-rule px-3 py-2 text-micro leading-relaxed text-dimmer">{demo ? "Angka hanya untuk pratinjau tata letak." : "TradingView delayed snapshot. Top 10 dihitung ulang setelah filter cap; periode mengubah persentase harga."}</p>
    </div>}
  </aside>;
}
