"use client";

import { useEffect, useState } from "react";
import { directionClass } from "@/lib/format";
import type { IhsgQuote } from "@/lib/market-data/ihsg";

const number = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function IhsgQuoteBadge({ initial }: { initial: IhsgQuote | null }) {
  const [quote, setQuote] = useState(initial);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/market/ihsg", { cache: "no-store" });
        if (!response.ok) return;
        const latest = (await response.json()) as IhsgQuote;
        if (alive && latest.price > 0) setQuote(latest);
      } catch {
        // Keep the last dated value; a failed refresh must not appear as a new quote.
      }
    };
    const timer = window.setInterval(refresh, 45_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { alive = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  return <div aria-label="IHSG, data tertunda" className="flex min-w-0 items-center gap-2 px-3 py-1.5">
    <span className="shrink-0 font-display text-xs font-bold tracking-widest text-amber">IHSG</span>
    {quote ? <div className="min-w-0 leading-tight"><div className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-baseline sm:gap-1.5"><strong className="whitespace-nowrap font-display text-sm font-bold tabular-nums text-ink-hi">{number.format(quote.price)}</strong><span className={`whitespace-nowrap text-[11px] font-bold tabular-nums ${directionClass(quote.change)}`}><span className="hidden sm:inline">{quote.change >= 0 ? "+" : ""}{number.format(quote.change)} </span>{quote.changePct >= 0 ? "+" : ""}{number.format(quote.changePct)}%</span></div><div className="truncate text-[10px] text-dim" title={`Yahoo Finance delayed quote · ${quote.asOf}`}>Tertunda · {timeLabel(quote.asOf)} WIB</div></div> : <span className="text-xs text-dim">N/D · feed tidak tersedia</span>}
  </div>;
}
