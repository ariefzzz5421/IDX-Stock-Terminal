"use client";

import { useEffect, useState } from "react";
import { jakartaNow, marketStatus, type MarketStatus } from "@/lib/market-session";

/**
 * Market Open / Closed on the IDX schedule. Rendered client-side and ticking,
 * because a server-rendered badge would freeze at build/request time and the
 * whole point is that it tracks the clock.
 */
export function MarketStatusBadge() {
  const [status, setStatus] = useState<MarketStatus | null>(null);
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      setStatus(marketStatus());
      setClock(jakartaNow().clock);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // Nothing until mounted: the server and the viewer's clock won't agree.
  if (!status || !clock) {
    return (
      <div className="flex items-center gap-2 px-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-dimmer" />
        <span className="text-xs uppercase tracking-[0.12em] text-dim">
          Market …
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
        <span
          className={`text-xs font-bold uppercase tracking-[0.1em] ${text}`}
        >
          {open ? "Market Open" : status.label}
        </span>
        <span className="text-[11px] tracking-[0.04em] text-dim">
          {status.next} · {clock} WIB
        </span>
      </div>
    </div>
  );
}
