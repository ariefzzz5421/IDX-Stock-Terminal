"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import { formatValue } from "@/lib/format";
import { indexFlowSlices, indexWeightSlices } from "@/lib/index-exposure-chart";
import type { ForeignFlowResult } from "@/lib/foreign-flow";
import type { IndonesiaIndexSnapshot } from "@/lib/index-exposure";

const COLORS = ["#4cc5e8", "#ffad32", "#39cb8a", "#b591f5", "#fa7485", "#66a8ff", "#d7c26d", "#69c5ba", "#da89be", "#88ba6c", "#667389"];
const CIRCUMFERENCE = 2 * Math.PI * 79;
const pct = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

export function IndexExposurePie({ snapshot, flow }: { snapshot: IndonesiaIndexSnapshot; flow: ForeignFlowResult }) {
  const [mode, setMode] = useState<"weight" | "flow">("weight");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const weights = indexWeightSlices(snapshot);
  const flows = indexFlowSlices(snapshot, flow);
  const slices = mode === "weight" ? weights : flows;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const listedWeight = weights.filter((slice) => slice.code !== null).reduce((sum, slice) => sum + slice.value, 0);
  const netFlow = flows.reduce((sum, slice) => sum + (slice.netValue ?? 0), 0);
  const activeCode = hoverCode ?? selectedCode;
  const selected = slices.find((slice) => (slice.code ?? "other") === activeCode) ?? null;

  function activate(code: string) {
    setSelectedCode((current) => current === code ? null : code);
  }

  return <section className="border-b border-rule bg-void/40 px-3 py-4 sm:px-5" aria-label={`Pie chart bobot dan arus asing ${snapshot.title}`}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h4 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-hi">Komposisi indeks</h4><p className="mt-1 text-micro text-dim">{snapshot.provider} · snapshot {snapshot.snapshotDate}</p></div>
      <div className="flex border border-rule-hi p-0.5 text-micro" role="group" aria-label="Pilih data pie chart">
        <button type="button" onClick={() => { setMode("weight"); setSelectedCode(null); setHoverCode(null); }} aria-pressed={mode === "weight"} className={`min-h-9 px-2.5 py-1 font-semibold ${mode === "weight" ? "bg-amber text-void" : "text-dim hover:text-ink-hi"}`}>Bobot indeks</button>
        <button type="button" onClick={() => { setMode("flow"); setSelectedCode(null); setHoverCode(null); }} aria-pressed={mode === "flow"} className={`min-h-9 px-2.5 py-1 font-semibold ${mode === "flow" ? "bg-amber text-void" : "text-dim hover:text-ink-hi"}`}>Arus asing</button>
      </div>
    </div>
    <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:items-center">
      <div className="relative mx-auto aspect-square w-full max-w-[14rem]">
        <svg viewBox="0 0 240 240" className="h-full w-full" role="group" aria-label={mode === "weight" ? `Bobot ${snapshot.title}: ${pct.format(listedWeight)} persen pada saham yang ditampilkan` : flows.length ? `Arus asing pada ${flows.length} saham yang tercakup, total nilai absolut ${formatValue(total)}` : "Arus asing belum tersedia untuk chart"}>
          <circle cx="120" cy="120" r="79" fill="none" stroke="#273344" strokeWidth="39" />
          {slices.map((slice, index) => {
            const key = slice.code ?? "other";
            const fraction = total > 0 ? slice.value / total : 0;
            const length = Math.max(0, fraction * CIRCUMFERENCE - 1);
            const preceding = slices.slice(0, index).reduce((sum, item) => sum + item.value, 0);
            const dashOffset = total > 0 ? -preceding / total * CIRCUMFERENCE : 0;
            return <circle key={key} cx="120" cy="120" r="79" fill="none" stroke={COLORS[index % COLORS.length]} strokeWidth={activeCode === key ? 46 : 39} strokeDasharray={`${length} ${CIRCUMFERENCE - length}`} strokeDashoffset={dashOffset} transform="rotate(-90 120 120)" className="cursor-pointer outline-none transition-[stroke-width,opacity] duration-150 focus:opacity-70" role="button" tabIndex={0} aria-label={`${slice.code ?? slice.label}: ${mode === "weight" ? `${pct.format(slice.value)}%` : formatValue(slice.netValue)}`} onMouseEnter={() => setHoverCode(key)} onMouseLeave={() => setHoverCode(null)} onFocus={() => setHoverCode(key)} onBlur={() => setHoverCode(null)} onClick={() => activate(key)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(key); } }} />;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-[27%] flex flex-col items-center justify-center text-center" aria-live="polite">
          {selected?.code && <CompanyLogo code={selected.code} size="md" />}
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-dim">{selected?.code ?? (mode === "weight" ? "TOTAL BOBOT" : "NETO TERCAKUP")}</span>
          <strong className="mt-0.5 text-base font-bold tabular-nums text-ink-hi">{selected ? (mode === "weight" ? `${pct.format(selected.value)}%` : formatValue(selected.netValue)) : (mode === "weight" ? "100%" : flows.length ? formatValue(netFlow) : "N/D")}</strong>
        </div>
      </div>
      <div className="min-w-0">
        <div className="grid gap-2 border-b border-rule pb-3 text-micro sm:grid-cols-2">
          {mode === "weight" ? <><p>Total indeks <strong className="block text-sm text-ink-hi">100%</strong></p><p>Saham ditampilkan <strong className="block text-sm text-cyan">{pct.format(listedWeight)}% · {snapshot.constituents.length}/{snapshot.totalConstituents} saham</strong></p></> : <><p>Total neto tercakup <strong className={`block text-sm ${netFlow >= 0 ? "text-up" : "text-down"}`}>{flows.length ? formatValue(netFlow) : "N/D"}</strong></p><p>Nilai neto absolut <strong className="block text-sm text-ink-hi">{flows.length ? formatValue(total) : "N/D"}</strong></p></>}
        </div>
        {slices.length ? <div className="mt-2 grid max-h-64 min-w-0 grid-cols-1 gap-1 overflow-y-auto pr-1 sm:grid-cols-2" aria-label={`Rincian ${mode === "weight" ? "bobot" : "arus asing"}`}>
          {slices.map((slice, index) => {
            const key = slice.code ?? "other";
            return <div key={key} className={`flex min-w-0 items-center gap-1.5 border px-2 py-1.5 ${activeCode === key ? "border-amber bg-amber/10" : "border-rule bg-panel"}`}>
              <button type="button" onMouseEnter={() => setHoverCode(key)} onMouseLeave={() => setHoverCode(null)} onFocus={() => setHoverCode(key)} onBlur={() => setHoverCode(null)} onClick={() => activate(key)} aria-pressed={selectedCode === key} className="flex min-h-9 min-w-0 flex-1 items-center gap-1.5 text-left">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {slice.code && <CompanyLogo code={slice.code} size="sm" />}
                <span className="min-w-0"><strong className="block truncate text-[11px] text-ink-hi">{slice.code ?? slice.label}</strong><span className="block truncate text-[10px] text-dim">{mode === "weight" ? slice.label : slice.netValue != null && slice.netValue >= 0 ? "Beli neto" : "Jual neto"}</span></span>
                <span className="ml-auto shrink-0 text-[11px] font-bold tabular-nums text-amber">{mode === "weight" ? `${pct.format(slice.value)}%` : `${pct.format(total ? slice.value / total * 100 : 0)}%`}</span>
              </button>
              {slice.code && <Link href={`/asset/${slice.code}`} aria-label={`Buka profil ${slice.code}`} className="grid h-9 w-7 shrink-0 place-items-center text-cyan hover:text-amber"><ArrowUpRight className="h-3.5 w-3.5" /></Link>}
            </div>;
          })}
        </div> : <p className="mt-3 border border-rule-hi bg-panel px-3 py-3 text-xs leading-5 text-dim">{flow.available ? "Tidak ada nilai arus asing untuk konstituen yang muncul pada daftar Top 10 beli/jual. Ini bukan berarti arusnya nol." : "Data arus asing harian belum tersedia dari sumber terhubung. Bobot indeks tetap dapat dilihat dari snapshot resmi."}</p>}
        <p className="mt-2 text-[10px] leading-4 text-dim">{mode === "weight" ? "Irisan menunjukkan bobot konstituen dalam indeks, bukan dana masuk/keluar. Bobot per saham dibulatkan oleh penerbit." : flow.available ? `Sumber ${flow.source} · ${flow.date}. Hanya ticker indeks yang muncul di Top 10 beli/jual dan memiliki nilai neto. Besar irisan = bagian dari total nilai neto absolut yang tercakup; warna/nilai tanda menunjukkan arah. Bukan aliran dana ETF atau seluruh indeks.` : "Flow tidak dihitung dari bobot indeks atau AUM ETF."}</p>
      </div>
    </div>
  </section>;
}
