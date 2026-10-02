"use client";

import { useEffect, useState } from "react";
import { jakartaNow, marketStatus, type MarketStatus } from "@/lib/market-session";
import { useProfileLanguage } from "@/components/profile/LanguageControl";

function marketText(status: MarketStatus, language: "id" | "en") {
  if (language === "id") return { label: status.label, next: status.next };
  const labels: Record<MarketStatus["state"], string> = {
    "pre-opening": "PRE-OPEN", "session-1": "OPEN · SESSION I", break: "BREAK",
    "session-2": "OPEN · SESSION II", "pre-closing": "PRE-CLOSE",
    "post-trading": "POST-TRADE", closed: "CLOSED", weekend: "CLOSED",
  };
  const next = status.next
    .replace("Buka Senin", "Opens Monday")
    .replace("Pra-pembukaan", "Pre-open")
    .replace("Pra-penutupan", "Pre-close")
    .replace("Istirahat", "Break")
    .replace("Lanjut", "Resumes")
    .replace("Selesai", "Ends")
    .replace("Buka", "Opens")
    .replace("Tutup", "Closes");
  return { label: labels[status.state], next };
}

/**
 * Market Open / Closed on the IDX schedule. Rendered client-side and ticking,
 * because a server-rendered badge would freeze at build/request time and the
 * whole point is that it tracks the clock.
 */
export function MarketStatusBadge() {
  const language = useProfileLanguage();
  const [status, setStatus] = useState<MarketStatus | null>(null);
  const [clock, setClock] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setStatus(marketStatus(now));
      setClock(jakartaNow(now).clock);
      setDate(new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-GB", {
        timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric",
      }).format(now));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [language]);

  // Nothing until mounted: the server and the viewer's clock won't agree.
  if (!status || !clock) {
    return (
      <div className="flex items-center gap-2 px-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-dimmer" />
        <span className="text-xs uppercase tracking-[0.12em] text-dim">
          {language === "id" ? "Pasar …" : "Market …"}
        </span>
      </div>
    );
  }

  const open = status.isOpen;
  // Pre-opening and pre-closing are live auctions but not continuous trading —
  // amber keeps them visibly distinct from both green and red.
  const transitional =
    status.state === "pre-opening" ||
    status.state === "pre-closing" ||
    status.state === "break";

  const dot = open ? "bg-up" : transitional ? "bg-amber" : "bg-down";
  const text = open ? "text-up" : transitional ? "text-amber" : "text-down";
  const copy = marketText(status, language);

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        {open && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-60 motion-reduce:hidden"
            aria-hidden="true"
          />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dot}`} />
      </span>

      <div className="flex flex-col leading-tight">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={`text-xs font-bold uppercase tracking-[0.1em] ${text}`}>{copy.label}</span>
          {date && <time dateTime={new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())} className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink">{date}</time>}
        </span>
        <span className="text-[11px] tracking-[0.04em] text-dim">
          {copy.next} · {clock} WIB
        </span>
      </div>
    </div>
  );
}
