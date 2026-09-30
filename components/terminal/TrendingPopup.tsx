"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Flame } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import { directionClass, formatPct, formatPrice, formatValue } from "@/lib/format";
import type { TrendingStock } from "@/lib/market-data/trending";

type Timeframe = keyof TrendingStock["changes"];

export function TrendingPopup({ stocks, demo = false }: { stocks: TrendingStock[]; demo?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("day");

  useEffect(() => {
    const screen = window.matchMedia("(min-width: 768px)");
    const followScreen = () => setExpanded(screen.matches);
    followScreen();
    screen.addEventListener("change", followScreen);
    return () => screen.removeEventListener("change", followScreen);
  }, []);

  return <aside aria-label="Top 10 saham aktif" className="fixed bottom-3 right-3 z-40 w-[min(23rem,calc(100dvw-2.5rem))] border border-rule-hi bg-panel shadow-[0_12px_42px_#0009] sm:bottom-5 sm:right-5">
    <div className="flex items-center gap-2 bg-panel-hi px-3 py-2">
      <Flame aria-hidden="true" className="h-4 w-4 text-amber" />
      <div className="min-w-0 flex-1"><div className="font-display text-xs font-bold uppercase tracking-widest text-amber">Top 10 trending</div><div className="truncate text-micro text-dim">{demo ? "Contoh data · bukan harga pasar" : "Peringkat nilai transaksi · data tertunda"}</div></div>
      <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-label={expanded ? "Minimalkan panel trending" : "Buka panel trending"} className="grid h-9 w-9 place-items-center border border-rule text-ink hover:text-amber">{expanded ? <ChevronDown aria-hidden="true" className="h-4 w-4" /> : <ChevronUp aria-hidden="true" className="h-4 w-4" />}</button>
    </div>
    {expanded && <div>
      <div className="flex items-center justify-between border-y border-rule px-3 py-2 text-micro text-dim"><span>10 saham · berdasarkan turnover</span><label className="flex items-center gap-2">Time frame<select value={timeframe} onChange={(event) => setTimeframe(event.target.value as Timeframe)} aria-label="Pilih time frame perubahan harga" className="min-h-9 border border-rule bg-void px-2 text-xs text-ink"><option value="day">1 hari</option><option value="week">1 minggu</option><option value="month">1 bulan</option></select></label></div>
      {stocks.length ? <ol className="max-h-[min(25rem,55vh)] overflow-y-auto">{stocks.map((stock, index) => <li key={stock.code} className="border-b border-rule/50 last:border-0"><Link href={`/asset/${stock.code}`} className="flex min-w-0 items-center gap-2 px-3 py-2 hover:bg-panel-hi"><span className="w-5 shrink-0 text-right text-micro tabular-nums text-dimmer">{index + 1}</span><CompanyLogo code={stock.code} logoUrl={stock.logoUrl} /><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-ink-hi">{stock.code}</span><span className="block truncate text-micro text-dim" title={stock.name}>{stock.name}</span></span><span className="text-right"><span className={`block text-xs font-bold tabular-nums ${directionClass(stock.changes[timeframe])}`}>{formatPct(stock.changes[timeframe])}</span><span className="block text-micro tabular-nums text-dim">{formatPrice(stock.lastPrice)} · {formatValue(stock.turnover)}</span></span></Link></li>)}</ol> : <p className="p-4 text-xs text-dim">Data perdagangan belum tersedia. Coba lagi setelah feed pasar pulih.</p>}
      <p className="border-t border-rule px-3 py-2 text-micro leading-relaxed text-dimmer">{demo ? "Angka hanya untuk pratinjau tata letak." : "TradingView delayed snapshot. Peringkat berdasarkan nilai transaksi sesi terakhir; dropdown mengubah periode perubahan harga."}</p>
    </div>}
  </aside>;
}
