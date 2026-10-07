"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

export function ResearchClock({ initialTime }: { initialTime: string }) {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date().toISOString()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return <time dateTime={time} aria-label="Waktu sekarang di Jakarta" className="block tabular-nums text-xs font-semibold text-ink-hi">
    {formatter.format(new Date(time))} WIB
  </time>;
}
