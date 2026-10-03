"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChartNoAxesCombined, ChevronLeft, ChevronRight, Puzzle, Star } from "lucide-react";
import type { StockRow } from "./StockTable";
import { StockTable } from "./StockTable";

export function MobileStockPanel({ title, description, rows, icon, offset }: { title: string; description: string; rows: StockRow[]; icon: "star" | "volume"; offset: string }) {
  const [open, setOpen] = useState(false);
  const close = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const triggerButton = trigger.current;
    close.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = original; document.removeEventListener("keydown", onKey); triggerButton?.focus(); };
  }, [open]);
  const Icon = icon === "star" ? Star : ChartNoAxesCombined;
  return <div className="md:hidden">
    {!open && <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-label={`Buka ${title}`} title={`Buka ${title}`} className={`fixed right-0 z-40 flex h-14 w-9 flex-col items-center justify-center gap-0.5 border border-r-0 border-amber-dim bg-panel-hi text-amber shadow-lg ${offset}`}><ChevronLeft className="h-3.5 w-3.5" /><Icon className="h-4 w-4" /></button>}
    {open && <><button type="button" onClick={() => setOpen(false)} aria-label={`Tutup ${title}`} className="fixed inset-0 z-[1090] bg-black/70" /><aside role="dialog" aria-modal="true" aria-label={title} className="fixed inset-y-0 right-0 z-[1100] flex w-[min(92vw,26rem)] min-w-0 flex-col border-l border-rule-hi bg-panel shadow-2xl"><header className="flex min-w-0 items-center gap-2 border-b border-rule bg-panel-hi p-3"><Icon className="h-4 w-4 shrink-0 text-amber" /><div className="min-w-0 flex-1"><h2 className="truncate text-xs font-bold uppercase text-amber">{title}</h2><p className="text-micro leading-4 text-dim">{description}</p></div><Link href="/extension" aria-label="Pengaturan Extension" className="grid h-9 w-9 shrink-0 place-items-center border border-rule text-cyan"><Puzzle className="h-4 w-4" /></Link><button ref={close} type="button" onClick={() => setOpen(false)} aria-label={`Minimalkan ${title}`} className="grid h-9 w-9 shrink-0 place-items-center border border-rule text-amber"><ChevronRight className="h-4 w-4" /></button></header><div className="min-h-0 flex-1 overflow-y-auto" onClick={(event) => { if ((event.target as HTMLElement).closest("a[href^='/asset/']")) setOpen(false); }}><StockTable rows={rows} extra="volume" rank={icon === "volume"} emptyMessage={icon === "star" ? "Belum ada saham pantauan." : "Peringkat volume belum tersedia dari snapshot pasar."} /></div></aside></>}
  </div>;
}
