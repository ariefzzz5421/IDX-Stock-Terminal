"use client";

import { useEffect, useState } from "react";

/**
 * IDX trades 09:00–15:50 WIB Monday to Friday, with a midday break. Close
 * enough for a status line; it does not know about exchange holidays.
 */
function sessionLabel(jakarta: Date): string {
  const day = jakarta.getUTCDay();
  if (day === 0 || day === 6) return "Closed · weekend";

  const minutes = jakarta.getUTCHours() * 60 + jakarta.getUTCMinutes();
  if (minutes < 9 * 60) return "Pre-open";
  if (minutes < 12 * 60) return "Session I";
  if (minutes < 13 * 60 + 30) return "Break";
  if (minutes <= 15 * 60 + 50) return "Session II";
  return "Closed";
}

export function MarketClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // Render nothing until mounted — server and client clocks would not agree.
  if (!now) {
    return <span className="ml-auto">JKT —</span>;
  }

  // Shift into WIB (UTC+7) so the getUTC* reads above are Jakarta wall time.
  const jakarta = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const hh = String(jakarta.getUTCHours()).padStart(2, "0");
  const mm = String(jakarta.getUTCMinutes()).padStart(2, "0");
  const ss = String(jakarta.getUTCSeconds()).padStart(2, "0");

  return (
    <>
      <span className="ml-auto">
        IDX <span className="text-ink">{sessionLabel(jakarta)}</span>
      </span>
      <span>
        JKT{" "}
        <span className="text-ink">
          {hh}:{mm}:{ss}
        </span>
      </span>
    </>
  );
}
