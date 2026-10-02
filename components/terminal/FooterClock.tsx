"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

export function FooterClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setNow(formatter.format(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <time aria-label="Jam saat ini, waktu Indonesia Barat" className="ml-auto text-ink tabular-nums" suppressHydrationWarning>{now ? `${now} WIB` : "--:--:-- WIB"}</time>;
}
