"use client";

import { useState } from "react";
import { BrainCircuit, RefreshCw } from "lucide-react";
import type { AnalystFact, MarketBrief } from "@/lib/ai-analyst";
import { CompanyLogo } from "./CompanyLogo";

type Result = { brief: MarketBrief; aiSummary: string | null; providerConfigured: boolean; providerError?: boolean };

function FactList({ title, items }: { title: string; items: AnalystFact[] }) {
  return <section className="min-w-0 border-t border-rule bg-panel">
    <h2 className="border-b border-rule bg-panel-hi px-4 py-2.5 text-micro font-bold uppercase tracking-widest text-amber">{title}</h2>
    {items.length ? <ol>{items.map((item, index) => <li key={item.code} className="flex min-w-0 items-center gap-2 border-b border-rule/60 px-4 py-2 text-xs last:border-0 sm:gap-3"><span className="w-5 shrink-0 tabular-nums text-amber sm:w-6">{index + 1}.</span><CompanyLogo code={item.code} /><a href={`/asset/${item.code}`} className="w-12 shrink-0 font-bold text-cyan hover:underline sm:w-16">{item.code}</a><span className="min-w-0 flex-1 text-right tabular-nums text-ink">{item.price}</span><span className="w-16 shrink-0 text-right tabular-nums text-ink-hi sm:w-20">{item.change}</span><span className="hidden w-28 shrink-0 text-right tabular-nums text-dim sm:block">{item.volume}</span></li>)}</ol> : <p className="px-4 py-3 text-xs text-dim">No verified snapshot rows.</p>}
  </section>;
}

export function AiAnalystPanel({ initial, configured }: { initial: MarketBrief; configured: boolean }) {
  const [result, setResult] = useState<Result>({ brief: initial, aiSummary: null, providerConfigured: configured });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai-analyst", { method: "POST", cache: "no-store" });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      setResult(await response.json() as Result);
    } catch {
      setError("Ringkasan tidak dapat diperbarui. Data sebelumnya tetap tersedia.");
    } finally { setLoading(false); }
  }

  const { brief, aiSummary, providerConfigured, providerError } = result;
  const timestamp = brief.asOf ? new Date(brief.asOf).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }) : "N/D";

  return <div className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-4 sm:px-6">
      <p className="text-micro uppercase tracking-widest text-amber">Market intelligence / sourced snapshot</p>
      <h1 className="mt-1 flex items-center gap-2 font-display text-xl font-bold text-ink-hi"><BrainCircuit aria-hidden="true" className="h-5 w-5 text-amber" /> AI Analyst</h1>
      <p className="mt-2 max-w-3xl text-xs leading-relaxed text-dim">Market activity and hot movers from a delayed IDX scanner snapshot. AI narrative is optional; facts remain visible without a provider.</p>
    </header>

    <div className="flex flex-wrap items-center gap-3 border-b border-rule bg-panel-hi px-4 py-3 text-xs sm:px-6">
      <span className="text-ink-hi">{brief.universeCount} stocks scanned</span>
      <span className="text-dim">Snapshot: {timestamp} WIB</span>
      <span className="text-dim">AI: {providerConfigured ? "configured" : "not configured"}</span>
      <button type="button" onClick={refresh} disabled={loading} className="ml-auto inline-flex min-h-9 items-center gap-2 border border-amber px-3 text-amber hover:bg-amber/10 disabled:opacity-50"><RefreshCw aria-hidden="true" className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />{loading ? "Updating…" : providerConfigured ? "Generate analysis" : "Refresh snapshot"}</button>
    </div>

    <section className="border-b border-rule p-4 sm:p-6">
      <h2 className="text-micro font-bold uppercase tracking-widest text-amber">Market brief</h2>
      <p className="mt-2 max-w-4xl text-sm leading-relaxed text-ink-hi">{brief.summary}</p>
      {aiSummary && <div className="mt-4 max-w-4xl border-l-2 border-cyan bg-panel-hi p-3"><h3 className="text-micro font-bold uppercase tracking-widest text-cyan">AI-generated interpretation</h3><p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-ink">{aiSummary}</p></div>}
      {!providerConfigured && <p className="mt-3 text-xs text-dim">AI provider belum dikonfigurasi. Ringkasan berbasis data terverifikasi tetap tersedia.</p>}
      {providerError && <p className="mt-3 text-xs text-down">AI provider gagal merespons; ringkasan berbasis data tetap tersedia.</p>}
      {error && <p role="status" className="mt-3 text-xs text-down">{error}</p>}
      <p className="mt-3 text-micro text-dim">Source: <a href={brief.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">TradingView Indonesia market movers ↗</a>. Delayed snapshot; no news or cause-of-move feed is connected.</p>
    </section>

    <div className="grid gap-px bg-rule xl:grid-cols-2">
      <FactList title="Top volume" items={brief.volumeLeaders} />
      <FactList title="Hot movers · absolute change" items={brief.hot} />
      <FactList title="Top gainers" items={brief.gainers} />
      <FactList title="Top losers" items={brief.losers} />
    </div>
  </div>;
}
