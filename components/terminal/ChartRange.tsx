"use client";

import { useEffect, useState } from "react";
import { CHART_RANGES, type ChartRange } from "@/lib/chart-ranges";
import { Chart, type ChartCandle } from "./Chart";

export function ChartRangeSelector({ code, initialCandles }: { code: string; initialCandles: ChartCandle[] }) {
  const [range, setRange] = useState<ChartRange>("1D");
  const [candles, setCandles] = useState(initialCandles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (range === "1D") return;
    const controller = new AbortController();
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/stocks/${encodeURIComponent(code)}/chart?range=${range}`, { signal: controller.signal });
        const data = (await response.json()) as { candles?: ChartCandle[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Riwayat harga tidak tersedia.");
        setCandles(data.candles ?? []);
        setError(null);
      } catch (cause) {
        if (!controller.signal.aborted) { setCandles([]); setError(cause instanceof Error ? cause.message : "Riwayat harga tidak tersedia."); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void fetchHistory();
    return () => controller.abort();
  }, [code, initialCandles, range]);

  return <div className="min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-3 py-2">
      <p className="text-micro text-dim">Yahoo Finance · delayed · {loading ? "Memuat…" : `${candles.length} batang`}</p>
      <label className="flex items-center gap-2 text-micro text-dim">Time frame
        <select value={range} onChange={(event) => { const next = event.target.value as ChartRange; setRange(next); setError(null); if (next === "1D") { setCandles(initialCandles); setLoading(false); } else setLoading(true); }} aria-label="Pilih rentang waktu grafik" className="min-h-10 border border-rule-hi bg-panel px-2 text-xs text-ink-hi outline-none focus:border-amber">
          {CHART_RANGES.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
      </label>
    </div>
    {error && <p role="alert" className="border-b border-rule px-3 py-2 text-xs text-down">{error}</p>}
    {loading ? <div className="grid h-[25rem] place-items-center text-xs text-dim">Memuat riwayat harga…</div> : <Chart candles={candles} intraday={["1H", "4H", "1D", "1W"].includes(range)} />}
  </div>;
}
