"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { List, X } from "lucide-react";
import { MARKET_CAP_AS_OF, MARKET_CAP_SNAPSHOT } from "@/data/business-locations/market-caps";
import { formatValue } from "@/lib/format";
import { BusinessCompanyLogo } from "./BusinessCompanyLogo";

export type HomeCompany = { key: string; name: string; operator: string; ticker?: string; exposure: boolean };

export function BusinessHomeCompanies({ items, preview }: { items: HomeCompany[]; preview: boolean }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const href = preview ? "/preview/lokasi-bisnis" : "/lokasi-bisnis";

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

  return <div className="border-t border-rule">
    <div className="business-home-tape gap-px overflow-x-auto bg-rule" aria-label="Perusahaan dan operator yang terpetakan">{items.map((item) => <CompanyEntry key={item.key} item={item} href={href} />)}</div>
    <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="business-home-company-sidebar" className="business-home-company-trigger w-full items-center justify-between px-4 py-2.5 text-xs text-cyan"><span className="inline-flex items-center gap-2"><List className="h-4 w-4" /> Perusahaan & operator</span><span>{items.length} →</span></button>
    {open && <button type="button" onClick={() => setOpen(false)} aria-label="Tutup daftar perusahaan" className="business-sidebar-backdrop" />}
    <aside id="business-home-company-sidebar" aria-label="Perusahaan dan operator" className={`business-home-company-sidebar ${open ? "is-open" : ""}`}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-panel-hi px-3 py-2 text-xs font-bold uppercase tracking-widest text-amber"><span>Perusahaan & operator · {items.length}</span><button ref={close} type="button" onClick={() => setOpen(false)} aria-label="Tutup daftar perusahaan" className="p-1 text-ink"><X className="h-4 w-4" /></button></div>
      <div className="divide-y divide-rule">{items.map((item) => <CompanyEntry key={item.key} item={item} href={href} />)}</div>
      <p className="px-3 py-3 text-micro text-dim">Market cap snapshot TradingView {MARKET_CAP_AS_OF}. Angka eksposur adalah kapitalisasi emiten, bukan nilai operator.</p>
    </aside>
  </div>;
}

function CompanyEntry({ item, href }: { item: HomeCompany; href: string }) {
  const cap = item.ticker ? MARKET_CAP_SNAPSHOT[item.ticker] : undefined;
  return <Link href={href} className="flex min-w-0 items-center gap-2 bg-panel px-3 py-2 hover:bg-panel-hi"><BusinessCompanyLogo company={item.operator} ticker={item.ticker} /><span className="min-w-0"><span className="block truncate text-xs font-bold text-cyan">{item.key}</span><span className="block truncate text-micro text-dim">{item.name}</span><span className="block truncate text-micro text-ink">{cap ? `${item.exposure ? `Cap ${item.ticker} (eksposur)` : "Mkt cap"} · ${formatValue(cap)}` : "Mkt cap N/D · non-emiten"}</span></span></Link>;
}
