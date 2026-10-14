"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import type { IndonesiaIndexSnapshot } from "@/lib/index-exposure";

const colors = ["#4cc5e8", "#ffad32", "#39cb8a", "#b591f5", "#fa7485", "#66a8ff", "#d7c26d", "#69c5ba", "#da89be", "#88ba6c"];
const amount = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

function constituentUsd(snapshot: IndonesiaIndexSnapshot, weightPct: number, capValue: number) {
  return snapshot.marketCapUnit === "USD_BILLION"
    ? capValue
    : snapshot.countryMarketCapUsdBillion * weightPct / 100;
}

export function IndexExposureBars({ snapshot }: { snapshot: IndonesiaIndexSnapshot }) {
  const [selectedCode, setSelectedCode] = useState(snapshot.constituents[0]?.code ?? "");
  const selected = snapshot.constituents.find((stock) => stock.code === selectedCode);
  const maxValue = Math.max(...snapshot.constituents.map((stock) => constituentUsd(snapshot, stock.weightPct, stock.capValue)), 1);

  return <section className="min-w-0 border-t border-rule bg-void/40 px-3 py-5 sm:px-5" aria-label={`Kapitalisasi saham ${snapshot.title}`}>
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div><h4 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-hi">Kapitalisasi saham Indonesia</h4><p className="mt-1 text-micro text-dim">Nilai pasar free float · US$ miliar · data {snapshot.snapshotDate}</p></div>
      <span className="text-micro text-cyan">Pilih batang untuk detail</span>
    </div>
    <div className="mt-4 overflow-x-auto pb-2" role="region" aria-label="Grafik batang kapitalisasi saham" tabIndex={0}>
      <div className="relative grid min-h-72 min-w-[46rem] items-end gap-2 border-b border-rule-hi px-2 pb-2 pt-4" style={{ gridTemplateColumns: `repeat(${snapshot.constituents.length}, minmax(0, 1fr))`, backgroundImage: "linear-gradient(to bottom, transparent calc(25% - 1px), var(--color-rule) 25%, transparent calc(25% + 1px), transparent calc(50% - 1px), var(--color-rule) 50%, transparent calc(50% + 1px), transparent calc(75% - 1px), var(--color-rule) 75%, transparent calc(75% + 1px))" }}>
        {snapshot.constituents.map((stock, index) => {
          const value = constituentUsd(snapshot, stock.weightPct, stock.capValue);
          const active = stock.code === selectedCode;
          return <button key={stock.code} type="button" onClick={() => setSelectedCode(stock.code)} aria-pressed={active} aria-label={`${stock.code}, kapitalisasi ${amount.format(value)} miliar dolar, bobot ${amount.format(stock.weightPct)} persen`} className="group flex h-64 min-w-0 flex-col items-center justify-end gap-1.5 rounded-sm px-0.5 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber">
            <span className={`text-[10px] font-bold tabular-nums ${active ? "text-amber" : "text-ink-hi"}`}>${amount.format(value)}B</span>
            <span className="relative flex h-48 w-full items-end justify-center"><span className={`block w-full max-w-14 rounded-t border transition-[height,opacity,transform] duration-200 group-hover:-translate-y-1 ${active ? "opacity-100" : "opacity-75 group-hover:opacity-100"}`} style={{ height: `${Math.max(7, value / maxValue * 100)}%`, borderColor: colors[index % colors.length], backgroundColor: `${colors[index % colors.length]}55` }} /></span>
            <CompanyLogo code={stock.code} size="sm" />
            <strong className={`truncate text-[10px] ${active ? "text-amber" : "text-cyan"}`}>{stock.code}</strong>
          </button>;
        })}
      </div>
    </div>
    {selected && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border border-rule bg-panel px-3 py-2 text-xs" aria-live="polite"><strong className="text-ink-hi">{selected.code} · {selected.name}</strong><span className="tabular-nums text-amber">${amount.format(constituentUsd(snapshot, selected.weightPct, selected.capValue))}B</span><span className="tabular-nums text-dim">{amount.format(selected.weightPct)}% dari {snapshot.title}</span><Link href={`/asset/${selected.code}`} className="ml-auto inline-flex min-h-9 items-center gap-1 text-cyan hover:underline">Profil saham <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>}
    {snapshot.marketCapUnit === "IDR_MILLION" && <p className="mt-2 text-[10px] leading-4 text-dim">Nilai USD per batang adalah perkiraan: kapitalisasi Indonesia US$80,511B × bobot saham pada FTSE Indonesia Index, keduanya dari factsheet 29 Mei 2026.</p>}
  </section>;
}
