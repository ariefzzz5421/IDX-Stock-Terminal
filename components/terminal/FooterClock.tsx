"use client";

import { useEffect, useState } from "react";

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric",
});

export function FooterClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <time aria-label="Tanggal dan jam saat ini, waktu Indonesia Barat" dateTime={now?.toISOString()} className="col-span-2 row-start-2 min-w-0 text-left text-ink tabular-nums sm:col-span-1 sm:ml-auto sm:whitespace-nowrap sm:text-right" suppressHydrationWarning>{now ? <><span>{dateFormatter.format(now)} · </span><span className="whitespace-nowrap">{timeFormatter.format(now)} WIB</span></> : <><span>-- --- ---- · </span><span className="whitespace-nowrap">--:--:-- WIB</span></>}</time>;
}
