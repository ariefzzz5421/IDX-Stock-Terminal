"use client";

import { useEffect, useState } from "react";
import { formatValue, formatVolume } from "@/lib/format";

type DailyFlow = { available: boolean; date: string | null; netShares?: number; estimatedNetValue?: number | null };

export function StockDailyFlow({ code }: { code: string }) {
  const [flow, setFlow] = useState<DailyFlow | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/stocks/${encodeURIComponent(code)}/flow`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<DailyFlow> : null)
      .then((value) => { if (!controller.signal.aborted) setFlow(value ?? { available: false, date: null }); })
      .catch(() => { if (!controller.signal.aborted) setFlow({ available: false, date: null }); });
    return () => controller.abort();
  }, [code]);
  const net = flow?.available ? flow.netShares ?? null : null;
  return <div className="min-w-0 border-t border-rule px-4 py-3 text-xs">
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2"><span className="font-bold uppercase tracking-wider text-amber">Foreign net flow · 1D</span><strong className={`font-display tabular-nums ${net === null ? "text-dim" : net >= 0 ? "text-up" : "text-down"}`}>{!flow ? "Memuat…" : net === null ? "N/D" : `${net >= 0 ? "+" : "−"}${formatVolume(Math.abs(net))} lembar`}</strong><span className="text-dim">Est. nilai {flow?.available && flow.estimatedNetValue != null ? `${flow.estimatedNetValue >= 0 ? "+" : "−"}${formatValue(Math.abs(flow.estimatedNetValue))}` : "N/D"}</span></div>
    <p className="mt-1 text-micro text-dim">{flow?.date ? `Ringkasan BEI ${flow.date}. ` : ""}Selisih beli dan jual investor asing; berbeda dari total nilai transaksi. Estimasi nilai = saham neto × harga penutupan.</p>
  </div>;
}
