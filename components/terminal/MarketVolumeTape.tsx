"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { List, X } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import { formatPrice, formatVolume } from "@/lib/format";
import type { TrendingStock } from "@/lib/market-data/trending";

export function MarketVolumeTape({ stocks }: { stocks: TrendingStock[] }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    const triggerButton = trigger.current;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", onKey); triggerButton?.focus(); };
  }, [open]);

  if (!stocks.length) return <p className="border-t border-rule px-4 py-3 text-xs text-dim">Peringkat volume belum tersedia dari feed pasar.</p>;

  return <div className="border-t border-rule">
    <div className="business-home-tape gap-px overflow-x-auto bg-rule" aria-label="Peringkat volume saham sesi terakhir">{stocks.map((stock, index) => <TapeEntry key={stock.code} stock={stock} rank={index + 1} />)}</div>
    <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="market-volume-sidebar" className="business-home-company-trigger w-full items-center justify-between px-4 py-2.5 text-xs text-cyan"><span className="inline-flex items-center gap-2"><List aria-hidden="true" className="h-4 w-4" /> Top volume hari ini</span><span>#{stocks.length} →</span></button>
    {open && <button type="button" onClick={() => setOpen(false)} aria-label="Tutup ranking volume" className="business-sidebar-backdrop" />}
    <aside id="market-volume-sidebar" aria-label="Ranking volume saham" className={`business-home-company-sidebar ${open ? "is-open" : ""}`}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-panel-hi px-3 py-2 text-xs font-bold uppercase tracking-widest text-amber"><span>Top volume · sesi terakhir</span><button ref={close} type="button" onClick={() => setOpen(false)} aria-label="Tutup ranking volume" className="p-1 text-ink"><X aria-hidden="true" className="h-4 w-4" /></button></div>
      <div className="divide-y divide-rule">{stocks.map((stock, index) => <TapeEntry key={stock.code} stock={stock} rank={index + 1} />)}</div>
      <p className="px-3 py-3 text-micro text-dim">Peringkat volume lembar saham dari snapshot TradingView tertunda. Saat bursa tutup, data adalah sesi terakhir.</p>
    </aside>
  </div>;
}

function TapeEntry({ stock, rank }: { stock: TrendingStock; rank: number }) {
  return <Link href={`/asset/${stock.code}`} className="flex min-w-0 items-center gap-2 bg-panel px-3 py-2 hover:bg-panel-hi"><span className="shrink-0 font-display text-xs font-bold text-amber">#{rank}</span><CompanyLogo code={stock.code} logoUrl={stock.logoUrl} /><span className="min-w-0"><span className="block truncate text-xs font-bold text-cyan">{stock.code} <span className="font-normal text-dim">{stock.name}</span></span><span className="block truncate text-micro text-ink">{formatPrice(stock.lastPrice)} · Vol {formatVolume(stock.volume)}</span></span></Link>;
}
