"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import { indexWeightSlices } from "@/lib/index-exposure-chart";
import type { IndonesiaIndexSnapshot } from "@/lib/index-exposure";

const COLORS = ["#4cc5e8", "#ffad32", "#39cb8a", "#b591f5", "#fa7485", "#66a8ff", "#d7c26d", "#69c5ba", "#da89be", "#88ba6c", "#667389"];
const CIRCUMFERENCE = 2 * Math.PI * 79;
const pct = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const usd = (value: number) => `$${pct.format(value)}B`;

export function IndexExposurePie({ snapshot }: { snapshot: IndonesiaIndexSnapshot }) {
  const [mode, setMode] = useState<"weight" | "flow">("weight");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const slices = indexWeightSlices(snapshot);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const listedWeight = slices.filter((slice) => slice.code !== null).reduce((sum, slice) => sum + slice.value, 0);
  const activeCode = hoverCode ?? selectedCode;
  const selected = slices.find((slice) => (slice.code ?? "other") === activeCode) ?? null;

  function changeMode(next: "weight" | "flow") {
    setMode(next);
    setSelectedCode(null);
    setHoverCode(null);
  }

  function activate(code: string) {
    setSelectedCode((current) => current === code ? null : code);
  }

  return <section className="border-b border-rule bg-void/40 px-3 py-4 sm:px-5" aria-label={`Komposisi indeks ${snapshot.title}`}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h4 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-hi">Komposisi indeks</h4><p className="mt-1 text-micro text-dim">{snapshot.provider} · snapshot {snapshot.snapshotDate}</p></div>
      <div className="flex border border-rule-hi p-0.5 text-micro" role="group" aria-label="Pilih data chart">
        <button type="button" onClick={() => changeMode("weight")} aria-pressed={mode === "weight"} className={`min-h-9 px-2.5 py-1 font-semibold ${mode === "weight" ? "bg-amber text-void" : "text-dim hover:text-ink-hi"}`}>Bobot indeks</button>
        <button type="button" onClick={() => changeMode("flow")} aria-pressed={mode === "flow"} className={`min-h-9 px-2.5 py-1 font-semibold ${mode === "flow" ? "bg-amber text-void" : "text-dim hover:text-ink-hi"}`}>Arus asing</button>
      </div>
    </div>
    {mode === "flow" ? <div className="mt-3 flex min-h-56 flex-col items-center justify-center border border-rule bg-panel px-4 text-center" role="status"><strong className="font-display text-base text-amber">Coming soon</strong><p className="mt-2 max-w-md text-xs leading-5 text-dim">Data arus beli dan jual asing belum tersedia dari sumber transaksi yang terverifikasi.</p></div> : <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:items-center">
      <div className="min-w-0 text-center">
        <strong className="block font-display text-2xl font-black tabular-nums text-ink-hi sm:text-3xl" title="Kapitalisasi pasar free float saham Indonesia dalam indeks; bukan AUM dana">US${pct.format(snapshot.countryMarketCapUsdBillion)}B</strong>
        <span className="sr-only">Kapitalisasi pasar free float Indonesia dalam indeks; bukan AUM dana</span>
        <div className="relative mx-auto mt-2 aspect-square w-full max-w-[14rem]">
        <svg viewBox="0 0 240 240" className="h-full w-full" role="group" aria-label={`Bobot ${snapshot.title}: ${pct.format(listedWeight)} persen pada saham yang ditampilkan`}>
          <circle cx="120" cy="120" r="79" fill="none" stroke="#273344" strokeWidth="39" />
          {slices.map((slice, index) => {
            const key = slice.code ?? "other";
            const fraction = total > 0 ? slice.value / total : 0;
            const length = Math.max(0, fraction * CIRCUMFERENCE - 1);
            const preceding = slices.slice(0, index).reduce((sum, item) => sum + item.value, 0);
            const dashOffset = total > 0 ? -preceding / total * CIRCUMFERENCE : 0;
            return <circle key={key} cx="120" cy="120" r="79" fill="none" stroke={COLORS[index % COLORS.length]} strokeWidth={activeCode === key ? 46 : 39} strokeDasharray={`${length} ${CIRCUMFERENCE - length}`} strokeDashoffset={dashOffset} transform="rotate(-90 120 120)" className="cursor-pointer outline-none transition-[stroke-width,opacity] duration-150 focus:opacity-70" role="button" tabIndex={0} aria-label={`${slice.code ?? slice.label}: ${pct.format(slice.value)}%`} onMouseEnter={() => setHoverCode(key)} onMouseLeave={() => setHoverCode(null)} onFocus={() => setHoverCode(key)} onBlur={() => setHoverCode(null)} onClick={() => activate(key)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(key); } }} />;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-[27%] flex flex-col items-center justify-center text-center" aria-live="polite">
          {selected?.code && <CompanyLogo code={selected.code} size="md" />}
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-dim">{selected?.code ?? "TOTAL BOBOT"}</span>
          <strong className="mt-0.5 text-base font-bold tabular-nums text-ink-hi">{selected ? `${pct.format(selected.value)}%` : "100%"}</strong>
          {selected && <span className="mt-0.5 text-[10px] font-bold tabular-nums text-cyan">{usd(snapshot.countryMarketCapUsdBillion * selected.value / 100)}</span>}
        </div>
        </div>
      </div>
      <div className="min-w-0">
        <div className="grid max-h-72 min-w-0 grid-cols-1 gap-1 overflow-y-auto pr-1 sm:grid-cols-2" aria-label="Rincian bobot dan kapitalisasi">
          {slices.map((slice, index) => {
            const key = slice.code ?? "other";
            return <div key={key} className={`flex min-w-0 items-center gap-1.5 border px-2 py-1.5 ${activeCode === key ? "border-amber bg-amber/10" : "border-rule bg-panel"}`}>
              <button type="button" onMouseEnter={() => setHoverCode(key)} onMouseLeave={() => setHoverCode(null)} onFocus={() => setHoverCode(key)} onBlur={() => setHoverCode(null)} onClick={() => activate(key)} aria-pressed={selectedCode === key} className="flex min-h-9 min-w-0 flex-1 items-center gap-1.5 text-left">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {slice.code && <CompanyLogo code={slice.code} size="sm" />}
                <span className="min-w-0"><strong className="block truncate text-[11px] text-ink-hi">{slice.code ?? slice.label}</strong><span className="block truncate text-[10px] text-dim">{slice.label}</span></span>
                <span className="ml-auto shrink-0 text-right tabular-nums"><strong className="block text-[11px] text-amber">{pct.format(slice.value)}%</strong><span className="block text-[10px] text-cyan">{usd(snapshot.countryMarketCapUsdBillion * slice.value / 100)}</span></span>
              </button>
              {slice.code && <Link href={`/asset/${slice.code}`} aria-label={`Buka profil ${slice.code}`} className="grid h-9 w-7 shrink-0 place-items-center text-cyan hover:text-amber"><ArrowUpRight className="h-3.5 w-3.5" /></Link>}
            </div>;
          })}
        </div>
      </div>
    </div>}
  </section>;
}
