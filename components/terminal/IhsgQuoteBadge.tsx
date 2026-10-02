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

  return <div aria-label="IHSG, delayed data" className="flex w-full min-w-0 items-center gap-2.5 px-3 py-1.5 lg:min-w-52 lg:px-4">
    <span className="shrink-0 font-display text-sm font-bold tracking-widest text-amber">IHSG</span>
    {quote ? <div className="min-w-0 flex-1 leading-tight"><div className="flex items-baseline justify-between gap-2 sm:justify-start sm:gap-1.5"><strong className="whitespace-nowrap font-display text-base font-bold tabular-nums text-ink-hi lg:text-lg">{number.format(quote.price)}</strong><span className={`ml-auto whitespace-nowrap text-[11px] font-bold tabular-nums sm:ml-0 ${directionClass(quote.change)}`}><span className="hidden sm:inline">{quote.change >= 0 ? "+" : ""}{number.format(quote.change)} </span>{quote.changePct >= 0 ? "+" : ""}{number.format(quote.changePct)}%</span></div><div className="truncate text-[10px] text-dim" title={`Yahoo Finance delayed quote · ${quote.asOf}`}><span className="sm:hidden">{timeLabel(quote.asOf)} WIB</span><span className="hidden sm:inline">Delayed · {timeLabel(quote.asOf)} WIB</span></div></div> : <span className="text-xs text-dim">N/D · feed unavailable</span>}
  </div>;
}
