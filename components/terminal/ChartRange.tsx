"use client";

import { useEffect, useState } from "react";
import { MousePointer2, Minus, Save, Trash2, TrendingUp, Undo2 } from "lucide-react";
import { CHART_RANGES, type ChartRange } from "@/lib/chart-ranges";
import { Chart, type ChartCandle, type ChartDrawing, type ChartTool } from "./Chart";

export function ChartRangeSelector({ code, initialCandles }: { code: string; initialCandles: ChartCandle[] }) {
  const [range, setRange] = useState<ChartRange>("1D");
  const [candles, setCandles] = useState(initialCandles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<ChartTool>("cursor");
  const [drawings, setDrawings] = useState<ChartDrawing[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(`idx-chart-setup:${code}`);
        if (!raw) return;
        const setup = JSON.parse(raw) as { range?: ChartRange; drawings?: ChartDrawing[] };
        if (CHART_RANGES.some((option) => option.key === setup.range)) setRange(setup.range!);
        if (Array.isArray(setup.drawings)) setDrawings(setup.drawings.filter(isValidDrawing).slice(0, 50));
        setSaved(true);
      } catch { /* Ignore damaged local preferences; market data still renders. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [code]);

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
        <select value={range} onChange={(event) => { const next = event.target.value as ChartRange; setRange(next); setSaved(false); setError(null); if (next === "1D") { setCandles(initialCandles); setLoading(false); } else setLoading(true); }} aria-label="Pilih rentang waktu grafik" className="min-h-10 border border-rule-hi bg-panel px-2 text-xs text-ink-hi outline-none focus:border-amber">
          {CHART_RANGES.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
      </label>
    </div>
    <div className="flex flex-wrap items-center gap-1 border-b border-rule px-2 py-1.5" role="toolbar" aria-label="Alat gambar grafik">
      <ToolButton icon={MousePointer2} label="Kursor" active={tool === "cursor"} onClick={() => setTool("cursor")} />
      <ToolButton icon={Minus} label="Garis harga horizontal" active={tool === "horizontal"} onClick={() => setTool("horizontal")} />
      <ToolButton icon={TrendingUp} label="Garis tren (pilih dua titik)" active={tool === "trend"} onClick={() => setTool("trend")} />
      <span className="mx-1 h-5 border-l border-rule" aria-hidden="true" />
      <ToolButton icon={Undo2} label="Batalkan gambar terakhir" onClick={() => { setDrawings((current) => current.slice(0, -1)); setSaved(false); }} disabled={!drawings.length} />
      <ToolButton icon={Trash2} label="Hapus semua gambar" onClick={() => { setDrawings([]); setSaved(false); }} disabled={!drawings.length} />
      <button type="button" onClick={() => { try { localStorage.setItem(`idx-chart-setup:${code}`, JSON.stringify({ range, drawings })); setSaved(true); } catch { setError("Pengaturan tidak dapat disimpan di perangkat ini."); } }} className="ml-auto inline-flex min-h-9 items-center gap-1 border border-rule-hi px-2 text-micro text-cyan hover:border-amber focus-visible:outline-amber"><Save className="h-3.5 w-3.5" aria-hidden="true" /> Simpan setup</button>
      <span className="text-micro text-dim" aria-live="polite">{saved ? "Tersimpan di perangkat" : tool === "trend" ? "Klik dua titik" : tool === "horizontal" ? "Klik harga" : ""}</span>
    </div>
    {error && <p role="alert" className="border-b border-rule px-3 py-2 text-xs text-down">{error}</p>}
    {loading ? <div className="grid h-[25rem] place-items-center text-xs text-dim">Memuat riwayat harga…</div> : <Chart candles={candles} intraday={["1H", "4H", "1D", "1W"].includes(range)} tool={tool} drawings={drawings} onAddDrawing={(drawing) => { setDrawings((current) => [...current, drawing]); setSaved(false); }} />}
  </div>;
}

function ToolButton({ icon: Icon, label, active, disabled, onClick }: { icon: typeof MousePointer2; label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick} className={`grid min-h-9 min-w-9 place-items-center border text-dim hover:text-amber focus-visible:outline-amber disabled:opacity-35 ${active ? "border-amber bg-amber/10 text-amber" : "border-rule"}`}><Icon className="h-4 w-4" aria-hidden="true" /></button>;
}

function isValidDrawing(value: unknown): value is ChartDrawing {
  if (!value || typeof value !== "object") return false;
  const drawing = value as Partial<ChartDrawing>;
  if (typeof drawing.id !== "string" || drawing.id.length > 100) return false;
  if (drawing.kind === "horizontal") return Number.isFinite(drawing.price) && Number(drawing.price) > 0;
  if (drawing.kind === "trend") {
    return Number.isFinite(drawing.from?.time) && Number.isFinite(drawing.from?.price) &&
      Number.isFinite(drawing.to?.time) && Number.isFinite(drawing.to?.price) &&
      Number(drawing.from?.price) > 0 && Number(drawing.to?.price) > 0;
  }
  return false;
}
