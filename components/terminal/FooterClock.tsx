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
  return <time aria-label="Tanggal dan jam saat ini, waktu Indonesia Barat" dateTime={now?.toISOString()} className="ml-auto whitespace-nowrap text-right text-ink tabular-nums" suppressHydrationWarning>{now ? `${dateFormatter.format(now)} · ${timeFormatter.format(now)} WIB` : "-- --- ---- · --:--:-- WIB"}</time>;
}
