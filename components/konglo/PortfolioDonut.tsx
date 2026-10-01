"use client";

import { useState } from "react";
import { formatRupiahCompact, formatShares } from "@/lib/konglo-format";

type Slice = { code: string; shares: number; price: number; value: number };
const COLORS = ["#f5a623", "#36b6d9", "#50c49a", "#b59bf2", "#e77b81", "#d7bd6a", "#62aee8", "#d795c2"];

/** Value-weighted chart. Group exposure and unpriced positions are intentionally excluded. */
export function PortfolioDonut({ items }: { items: Slice[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const selected = hovered ?? pinned;
  const sorted = [...items].filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <div className="border border-rule bg-void p-5 text-xs leading-relaxed text-dim">Grafik belum tersedia karena jumlah saham langsung dan harga yang dapat dibandingkan belum lengkap. Keterkaitan grup tidak dihitung sebagai portofolio pribadi.</div>;

  const active = sorted.find((item) => item.code === selected) ?? null;
  const slices = sorted.reduce<Array<Slice & { fraction: number; start: number; color: string }>>((acc, item, index) => {
    const fraction = item.value / total;
    const previous = acc.at(-1);
    const start = previous ? previous.start + previous.fraction : 0;
    return [...acc, { ...item, fraction, start, color: COLORS[index % COLORS.length] }];
  }, []);

  return <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(11rem,15rem)_minmax(0,1fr)] sm:items-center">
    <div className="relative mx-auto aspect-square w-full max-w-60">
      <svg viewBox="0 0 200 200" role="img" aria-label="Komposisi nilai saham langsung yang diketahui" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r="72" fill="none" stroke="var(--color-rule, #303644)" strokeWidth="24" />
        {slices.map((item) => <circle key={item.code} cx="100" cy="100" r="72" fill="none" stroke={item.color} strokeWidth={selected === item.code ? 30 : 24} strokeDasharray={`${Math.max(0, item.fraction * 452.39 - 2)} 452.39`} strokeDashoffset={-item.start * 452.39} className="cursor-pointer transition-[stroke-width,opacity] duration-150" opacity={selected && selected !== item.code ? 0.52 : 1} onMouseEnter={() => setHovered(item.code)} onMouseLeave={() => setHovered(null)} onClick={() => setPinned(pinned === item.code ? null : item.code)} />)}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-micro uppercase tracking-wider text-dim">{active?.code ?? "Nilai indikatif"}</span>
        <strong className="mt-1 font-display text-sm text-ink-hi sm:text-base">{formatRupiahCompact(active?.value ?? total)}</strong>
        {active && <span className="text-micro text-dim">{(active.value / total * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%</span>}
      </div>
    </div>
    <div className="min-w-0 space-y-1" aria-label="Pilih saham untuk melihat rincian">
      {slices.map((item) => <button key={item.code} type="button" onFocus={() => setHovered(item.code)} onBlur={() => setHovered(null)} onMouseEnter={() => setHovered(item.code)} onMouseLeave={() => setHovered(null)} onClick={() => setPinned(pinned === item.code ? null : item.code)} aria-pressed={pinned === item.code} className={`flex min-h-11 w-full items-center gap-2 border px-2 text-left text-xs hover:border-amber focus-visible:border-amber focus-visible:outline-none ${selected === item.code ? "border-amber bg-amber/5" : "border-rule"}`}>
        <span className="h-3 w-3 shrink-0" style={{ backgroundColor: item.color }} aria-hidden="true" />
        <span className="min-w-0 flex-1"><strong className="block text-ink-hi">{item.code}</strong><span className="block truncate text-micro text-dim">{formatShares(item.shares)} lembar · Rp {formatShares(item.price)}/lembar</span></span>
        <span className="text-right font-display tabular-nums text-ink-hi">{(item.fraction * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%</span>
      </button>)}
    </div>
  </div>;
}
