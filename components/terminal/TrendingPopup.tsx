"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight, Flame, Grip, Puzzle, SlidersHorizontal } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import { directionClass, formatPct, formatPrice, formatValue, formatVolume } from "@/lib/format";
import type { MarketCapFilter, TrendingStock } from "@/lib/market-data/trending";
import { useProfileLanguage } from "@/components/profile/LanguageControl";
import { setTrendingDockMinimized } from "@/lib/trending-extension";

type Timeframe = keyof TrendingStock["changes"];
type Props = {
  stocks: TrendingStock[];
  byMarketCap?: Record<MarketCapFilter, TrendingStock[]>;
  demo?: boolean;
  initialMinimized?: boolean;
};

const CAP_OPTIONS: Array<{ value: MarketCapFilter; label: string }> = [
  { value: "all", label: "All market caps" },
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

export function TrendingPopup({ stocks, byMarketCap, demo = false, initialMinimized = false }: Props) {
  const language = useProfileLanguage();
  const [expanded, setExpanded] = useState(!demo && !initialMinimized);
  const [timeframe, setTimeframe] = useState<Timeframe>("day");
  const [capFilter, setCapFilter] = useState<MarketCapFilter>("all");
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);
  const visible = byMarketCap?.[capFilter] ?? stocks.filter((stock) => matchesCap(stock, capFilter));

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const panel = event.currentTarget.closest("aside");
    if (!panel) return;
    const bounds = panel.getBoundingClientRect();
    dragOffset.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragOffset.current) return;
    const panel = event.currentTarget.closest("aside");
    if (!panel) return;
    setPosition({
      left: Math.max(8, Math.min(window.innerWidth - panel.clientWidth - 8, event.clientX - dragOffset.current.x)),
      top: Math.max(8, Math.min(window.innerHeight - panel.clientHeight - 8, event.clientY - dragOffset.current.y)),
    });
  }

  function endDrag() { dragOffset.current = null; }

  function closePanel() {
    setExpanded(false);
    if (!demo) setTrendingDockMinimized(true);
  }

  function openPanel() {
    setExpanded(true);
    if (!demo) setTrendingDockMinimized(false);
  }

  if (!expanded) {
    return <button type="button" onClick={openPanel} aria-label="Buka Top 10 Trending" title="Buka Top 10 Trending" className="fixed right-0 top-1/2 z-40 flex min-h-14 w-9 -translate-y-1/2 flex-col items-center justify-center gap-1 border border-r-0 border-amber-dim bg-panel-hi text-amber shadow-lg transition-colors hover:bg-panel sm:w-10">
      <ChevronLeft aria-hidden="true" className="h-4 w-4" /><Flame aria-hidden="true" className="h-4 w-4" />
    </button>;
  }

  return <aside aria-label="Top 10 Trending" style={position ? { left: position.left, top: position.top, right: "auto", bottom: "auto" } : undefined} className="fixed bottom-3 right-3 z-40 w-[min(24rem,calc(100dvw-1.5rem))] max-h-[calc(100dvh-1.5rem)] overflow-hidden border border-rule-hi bg-panel shadow-[0_12px_42px_#0009] sm:bottom-5 sm:right-5">
    <div className="flex items-center gap-2 bg-panel-hi px-2 py-2">
      <button type="button" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} aria-label="Drag Trending panel" title="Drag panel" className="grid h-9 w-7 shrink-0 touch-none place-items-center text-dim hover:text-amber"><Grip aria-hidden="true" className="h-4 w-4" /></button>
      <Flame aria-hidden="true" className="h-4 w-4 shrink-0 text-amber" />
      <div className="min-w-0 flex-1"><div className="font-display text-xs font-bold uppercase tracking-widest text-amber">Top 10 Trending</div><div className="truncate text-micro text-dim">{demo ? language === "id" ? "Data contoh · bukan harga pasar" : "Sample data · not market prices" : language === "id" ? "Peringkat volume harian · data tertunda" : "Daily volume rank · delayed data"}</div></div>
      {!demo && <Link href="/extension" aria-label="Pengaturan Extension" title="Pengaturan Extension" className="grid h-9 w-9 shrink-0 place-items-center border border-rule text-ink hover:text-amber"><Puzzle aria-hidden="true" className="h-4 w-4" /></Link>}
      <button type="button" onClick={closePanel} aria-label="Minimalkan Top 10 Trending" title="Minimalkan panel" className="grid h-9 w-9 shrink-0 place-items-center border border-rule text-ink hover:text-amber"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button>
    </div>
    <div className="grid grid-cols-2 gap-2 border-y border-rule px-3 py-2 text-micro text-dim">
      <label className="min-w-0"><span className="mb-1 flex items-center gap-1"><SlidersHorizontal aria-hidden="true" className="h-3 w-3" /> Market cap</span><select value={capFilter} onChange={(event) => setCapFilter(event.target.value as MarketCapFilter)} aria-label="Filter market cap" className="min-h-9 w-full border border-rule bg-void px-2 text-xs text-ink">{CAP_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label className="min-w-0"><span className="mb-1 block">Timeframe</span><select value={timeframe} onChange={(event) => setTimeframe(event.target.value as Timeframe)} aria-label="Choose price change timeframe" className="min-h-9 w-full border border-rule bg-void px-2 text-xs text-ink"><option value="day">1 day</option><option value="week">1 week</option><option value="month">1 month</option></select></label>
    </div>
    {visible.length ? <ol className="max-h-[min(27rem,55vh)] overflow-y-auto">{visible.map((stock, index) => <li key={stock.code} className="border-b border-rule/50 last:border-0"><Link href={`/asset/${stock.code}`} className="flex min-w-0 items-center gap-2 px-3 py-2 hover:bg-panel-hi"><span className="w-6 shrink-0 text-right text-micro tabular-nums text-amber">#{index + 1}</span><CompanyLogo code={stock.code} logoUrl={stock.logoUrl} /><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-ink-hi">{stock.code}</span><span className="block truncate text-micro text-ink" title={stock.name}>{stock.name}</span><span className="block text-micro text-dim">Cap {formatValue(stock.marketCap)}</span><span className="block truncate text-micro tabular-nums text-cyan" title={stock.turnover > 0 ? formatValue(stock.turnover) : undefined}>{language === "id" ? "Nilai harian" : "Daily value"} {stock.turnover > 0 ? formatValue(stock.turnover) : "N/D"}</span></span><span className="shrink-0 text-right"><span className={`block text-xs font-bold tabular-nums ${directionClass(stock.changes[timeframe])}`}>{formatPct(stock.changes[timeframe])}</span><span className="block text-micro tabular-nums text-dim">{formatPrice(stock.lastPrice)}</span><span className="block text-micro tabular-nums text-dim">Volume {formatVolume(stock.volume)}</span></span></Link></li>)}</ol> : <p className="p-4 text-xs text-dim">{language === "id" ? "Tidak ada saham yang cocok dengan filter." : "No stocks match this filter."}</p>}
    <p className="border-t border-rule px-3 py-2 text-micro leading-relaxed text-dimmer">{demo ? language === "id" ? "Angka hanya untuk pratinjau tata letak." : "Figures are for layout preview only." : language === "id" ? "Snapshot TradingView. Peringkat menurut volume lembar; nilai harian memakai Value.Traded (IDR). Pilihan waktu hanya mengubah kinerja harga." : "TradingView snapshot. Ranked by share volume; daily value uses Value.Traded (IDR). Timeframe changes price performance only."}</p>
  </aside>;
}
