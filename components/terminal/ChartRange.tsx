"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, BarChart3, MousePointer2, Minus, Save, Search, Star, Trash2, TrendingUp, Undo2, X } from "lucide-react";
import { CHART_RANGES, type ChartRange } from "@/lib/chart-ranges";
import { INDICATORS, type IndicatorKey } from "@/lib/chart-indicators";
import { Chart, type ChartCandle, type ChartDrawing, type ChartTool } from "./Chart";

export function ChartRangeSelector({ code, initialCandles }: { code: string; initialCandles: ChartCandle[] }) {
  const [range, setRange] = useState<ChartRange>("1D");
  const [candles, setCandles] = useState(initialCandles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<ChartTool>("cursor");
  const [drawings, setDrawings] = useState<ChartDrawing[]>([]);
  const [indicators, setIndicators] = useState<IndicatorKey[]>([]);
  const [favorites, setFavorites] = useState<IndicatorKey[]>([]);
  const [indicatorDialog, setIndicatorDialog] = useState(false);
  const [indicatorSearch, setIndicatorSearch] = useState("");
  const [indicatorCategory, setIndicatorCategory] = useState("All");
  const searchRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(`idx-chart-setup:${code}`);
        if (!raw) return;
        const setup = JSON.parse(raw) as { range?: ChartRange; drawings?: ChartDrawing[]; indicators?: IndicatorKey[]; favorites?: IndicatorKey[] };
        if (CHART_RANGES.some((option) => option.key === setup.range)) setRange(setup.range!);
        if (Array.isArray(setup.drawings)) setDrawings(setup.drawings.filter(isValidDrawing).slice(0, 50));
        if (Array.isArray(setup.indicators)) setIndicators(setup.indicators.filter(isIndicator).slice(0, INDICATORS.length));
        if (Array.isArray(setup.favorites)) setFavorites(setup.favorites.filter(isIndicator).slice(0, INDICATORS.length));
        setSaved(true);
      } catch { /* Ignore damaged local preferences; market data still renders. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [code]);

  useEffect(() => {
    if (!indicatorDialog) return;
    searchRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setIndicatorDialog(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [indicatorDialog]);

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

  const toggleIndicator = (key: IndicatorKey) => {
    setIndicators((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
    setSaved(false);
  };
  const visibleIndicators = INDICATORS.filter((indicator) =>
    (indicatorCategory === "All" || indicatorCategory === indicator.category || indicatorCategory === "Favorites" && favorites.includes(indicator.key)) &&
    `${indicator.name} ${indicator.short} ${indicator.description}`.toLowerCase().includes(indicatorSearch.toLowerCase()),
  );

  return <div className="min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <p className="text-micro text-dim">Yahoo Finance · delayed · {loading ? "Memuat…" : `${candles.length} batang`}</p>
        <button type="button" onClick={() => setIndicatorDialog(true)} className="inline-flex min-h-9 items-center gap-1.5 border border-rule-hi px-2 text-xs text-ink hover:border-amber hover:text-amber"><Activity className="h-4 w-4" aria-hidden="true" /> Indicators{indicators.length > 0 ? ` (${indicators.length})` : ""}</button>
      </div>
      <label className="flex items-center gap-2 text-micro text-dim">Time frame
        <select value={range} onChange={(event) => { const next = event.target.value as ChartRange; setRange(next); setSaved(false); setError(null); if (next === "1D") { setCandles(initialCandles); setLoading(false); } else setLoading(true); }} aria-label="Pilih rentang waktu grafik" className="min-h-10 border border-rule-hi bg-panel px-2 text-xs text-ink-hi outline-none focus:border-amber">
          {CHART_RANGES.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
      </label>
    </div>
    <div className="flex min-w-0 flex-col sm:flex-row">
    <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-rule px-2 py-1.5 sm:w-12 sm:flex-col sm:justify-start sm:border-b-0 sm:border-r sm:px-1" role="toolbar" aria-label="Alat gambar grafik">
      <ToolButton icon={MousePointer2} label="Kursor" active={tool === "cursor"} onClick={() => setTool("cursor")} />
      <ToolButton icon={Minus} label="Garis harga horizontal" active={tool === "horizontal"} onClick={() => setTool("horizontal")} />
      <ToolButton icon={TrendingUp} label="Garis tren (pilih dua titik)" active={tool === "trend"} onClick={() => setTool("trend")} />
      <span className="mx-1 h-5 border-l border-rule sm:my-1 sm:h-0 sm:w-7 sm:border-l-0 sm:border-t" aria-hidden="true" />
      <ToolButton icon={Undo2} label="Batalkan gambar terakhir" onClick={() => { setDrawings((current) => current.slice(0, -1)); setSaved(false); }} disabled={!drawings.length} />
      <ToolButton icon={Trash2} label="Hapus semua gambar" onClick={() => { setDrawings([]); setSaved(false); }} disabled={!drawings.length} />
      <button type="button" onClick={() => { try { localStorage.setItem(`idx-chart-setup:${code}`, JSON.stringify({ range, drawings, indicators, favorites })); setSaved(true); } catch { setError("Pengaturan tidak dapat disimpan di perangkat ini."); } }} title="Simpan setup" aria-label="Simpan setup grafik" className="grid min-h-9 min-w-9 place-items-center border border-rule text-cyan hover:border-amber focus-visible:outline-amber sm:mt-auto"><Save className="h-4 w-4" aria-hidden="true" /></button>
    </div>
    <div className="min-w-0 flex-1">
    {(indicators.length > 0 || saved || tool !== "cursor") && <div className="flex min-h-8 flex-wrap items-center gap-1 border-b border-rule px-2 py-1 text-micro text-dim" aria-live="polite">
      {indicators.map((key) => { const item = INDICATORS.find((entry) => entry.key === key)!; return <button key={key} type="button" onClick={() => toggleIndicator(key)} title={`Hapus ${item.name}`} className="inline-flex items-center gap-1 border border-rule-hi px-1.5 py-0.5 text-ink hover:text-down">{item.short}<X className="h-3 w-3" aria-hidden="true" /></button>; })}
      <span>{saved ? "Setup tersimpan" : tool === "trend" ? "Klik dua titik" : tool === "horizontal" ? "Klik harga" : ""}</span>
    </div>}
    {error && <p role="alert" className="border-b border-rule px-3 py-2 text-xs text-down">{error}</p>}
    {loading ? <div className="grid h-[25rem] place-items-center text-xs text-dim">Memuat riwayat harga…</div> : <Chart candles={candles} intraday={["1H", "4H", "1D", "1W"].includes(range)} tool={tool} drawings={drawings} indicators={indicators} onAddDrawing={(drawing) => { setDrawings((current) => [...current, drawing]); setSaved(false); }} />}
    </div></div>
    {indicatorDialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) setIndicatorDialog(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="indicator-title" className="flex max-h-[min(80vh,42rem)] w-full max-w-2xl flex-col overflow-hidden border border-rule-hi bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-rule px-4 py-3"><h3 id="indicator-title" className="flex items-center gap-2 font-display text-sm font-bold text-ink-hi"><BarChart3 className="h-4 w-4 text-amber" aria-hidden="true" /> Indicators</h3><button type="button" onClick={() => setIndicatorDialog(false)} aria-label="Tutup indikator" className="p-1 text-dim hover:text-ink"><X className="h-5 w-5" /></button></div>
        <label className="flex items-center gap-2 border-b border-rule px-4 py-2 text-dim"><Search className="h-4 w-4" aria-hidden="true" /><input ref={searchRef} value={indicatorSearch} onChange={(event) => setIndicatorSearch(event.target.value)} placeholder="Search indicators" aria-label="Cari indikator" className="min-h-9 min-w-0 flex-1 bg-transparent text-sm text-ink-hi outline-none placeholder:text-dim" /></label>
        <div className="flex gap-1 overflow-x-auto border-b border-rule px-3 py-2">{["All", "Favorites", "Trend", "Momentum", "Volume"].map((category) => <button key={category} type="button" onClick={() => setIndicatorCategory(category)} aria-pressed={indicatorCategory === category} className={`shrink-0 px-2 py-1.5 text-xs ${indicatorCategory === category ? "bg-amber/15 text-amber" : "text-dim hover:text-ink"}`}>{category}</button>)}</div>
        <div className="min-h-0 overflow-y-auto py-1">{visibleIndicators.length ? visibleIndicators.map((item) => <div key={item.key} className="flex items-center gap-2 px-3 hover:bg-panel-hi"><button type="button" onClick={() => setFavorites((current) => current.includes(item.key) ? current.filter((key) => key !== item.key) : [...current, item.key])} aria-label={`${favorites.includes(item.key) ? "Hapus favorit" : "Favoritkan"} ${item.name}`} aria-pressed={favorites.includes(item.key)} className={`grid min-h-11 min-w-9 place-items-center ${favorites.includes(item.key) ? "text-amber" : "text-dim"}`}><Star className="h-4 w-4" fill={favorites.includes(item.key) ? "currentColor" : "none"} /></button><button type="button" onClick={() => toggleIndicator(item.key)} aria-pressed={indicators.includes(item.key)} className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 py-2 text-left"><span className="min-w-0"><span className="block truncate text-sm text-ink-hi">{item.name}</span><span className="block text-micro text-dim">{item.description}</span></span><span className={`shrink-0 border px-2 py-1 text-micro ${indicators.includes(item.key) ? "border-amber text-amber" : "border-rule-hi text-dim"}`}>{indicators.includes(item.key) ? "Added" : "Add"}</span></button></div>) : <p className="p-6 text-center text-xs text-dim">No matching indicators.</p>}</div>
        <p className="border-t border-rule px-4 py-2 text-micro text-dim">Indicators are calculated from the displayed Yahoo Finance candles. Save setup to keep your selections on this device.</p>
      </section>
    </div>}
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

function isIndicator(value: unknown): value is IndicatorKey {
  return INDICATORS.some((indicator) => indicator.key === value);
}
