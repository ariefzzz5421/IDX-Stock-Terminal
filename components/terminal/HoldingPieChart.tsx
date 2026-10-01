"use client";

import { useState } from "react";
import type { NamedShareholder } from "@/lib/shareholders";

const COLORS = ["#f6a623", "#2cc6d6", "#83b65b", "#9b8ee8", "#e19a79", "#6b9fd0", "#d8c269", "#ca80b4", "#88b8a5", "#c2a68a"];
type Slice = { name: string; percentage: number; color: string };

function point(angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: 100 + 86 * Math.cos(radians), y: 100 + 86 * Math.sin(radians) };
}

function slicePath(start: number, end: number) {
  if (end - start >= 359.999) return "M 100 14 A 86 86 0 1 1 99.99 14 Z";
  const a = point(start);
  const b = point(end);
  return `M 100 100 L ${a.x} ${a.y} A 86 86 0 ${end - start > 180 ? 1 : 0} 1 ${b.x} ${b.y} Z`;
}

export function HoldingPieChart({ holders }: { holders: NamedShareholder[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  if (!holders.length) return null;

  const disclosed = holders.reduce((sum, holder) => sum + holder.percentage, 0);
  const remainder = Math.max(0, 100 - disclosed);
  const slices: Slice[] = holders.map((holder, index) => ({ name: holder.name, percentage: holder.percentage, color: COLORS[index % COLORS.length] }));
  if (remainder > 0.001) slices.push({ name: "Lainnya / belum terurai", percentage: remainder, color: "#515765" });
  const total = slices.reduce((sum, slice) => sum + slice.percentage, 0);
  const arcs = slices.map((slice, index) => ({
    slice,
    index,
    start: slices.slice(0, index).reduce((sum, earlier) => sum + earlier.percentage, 0) / total * 360,
    end: slices.slice(0, index + 1).reduce((sum, earlier) => sum + earlier.percentage, 0) / total * 360,
  }));

  return <div className="mt-4 grid min-w-0 gap-4 border border-rule-hi bg-panel-hi p-3 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
    <div className="relative mx-auto aspect-square w-full max-w-52">
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Diagram lingkaran struktur kepemilikan saham">
        {arcs.map(({ slice, index, start, end }) => <path key={`${slice.name}-${index}`} d={slicePath(start, end)} fill={slice.color} stroke="var(--color-panel-hi)" strokeWidth="1.5" opacity={selected === null || selected === index ? 1 : 0.42} onMouseEnter={() => setSelected(index)} onMouseLeave={() => setSelected(null)} onFocus={() => setSelected(index)} onBlur={() => setSelected(null)} tabIndex={0} aria-label={`${slice.name}: ${slice.percentage.toLocaleString("id-ID", { maximumFractionDigits: 4 })}%`} className="cursor-pointer outline-none focus:stroke-amber focus:stroke-[3]" />)}
      </svg>
      {selected !== null && <div className="pointer-events-none absolute inset-x-2 bottom-1 bg-panel/95 px-2 py-1 text-center text-[10px] text-ink-hi">{slices[selected].name}: {slices[selected].percentage.toLocaleString("id-ID", { maximumFractionDigits: 4 })}%</div>}
    </div>
    <div className="min-w-0">
      <p className="mb-2 text-xs font-semibold text-ink-hi">Struktur kepemilikan</p>
      <div className="max-h-52 overflow-y-auto">
        {slices.map((slice, index) => <button key={`${slice.name}-${index}`} type="button" onMouseEnter={() => setSelected(index)} onMouseLeave={() => setSelected(null)} onFocus={() => setSelected(index)} onBlur={() => setSelected(null)} onClick={() => setSelected(selected === index ? null : index)} className="flex min-h-8 w-full items-center gap-2 border-b border-rule/60 py-1 text-left text-[11px] hover:text-amber focus-visible:outline-amber" aria-pressed={selected === index}><span className="h-2.5 w-2.5 shrink-0" style={{ backgroundColor: slice.color }} /><span className="min-w-0 flex-1 break-words">{slice.name}</span><span className="shrink-0 tabular-nums">{slice.percentage.toLocaleString("id-ID", { maximumFractionDigits: 4 })}%</span></button>)}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-dim">Bagian “lainnya” adalah selisih dari pemegang &gt;1% yang tercantum; dapat mencakup pemegang kecil, data tidak terurai, dan pembulatan. Jika total sumber melebihi 100%, irisan dinormalisasi hanya untuk tampilan.</p>
    </div>
  </div>;
}
