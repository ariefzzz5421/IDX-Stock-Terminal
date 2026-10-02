"use client";

import { useState } from "react";
import Link from "next/link";

type Holder = { name: string; percentage: number };
type LinkItem = { code: string; shared: string[] };

export function OwnershipNetwork({ code, holders, related }: { code: string; holders: Holder[]; related: LinkItem[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const visible = holders.slice(0, 10);
  const relatedVisible = related.slice(0, 8);
  const rows = Math.max(visible.length, relatedVisible.length, 5);
  const height = Math.max(340, rows * 43 + 72);
  const holderY = (index: number) => 55 + index * 43;
  const relatedY = (index: number) => 55 + index * 43;
  return <div className="min-w-0 border border-rule-hi bg-panel-hi">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-3 py-2 text-xs"><strong className="uppercase tracking-wider text-amber">Ownership Network</strong><span className="text-micro text-dim">Pilih nama untuk menyorot koneksi</span></div>
    <div className="overflow-x-auto"><svg viewBox={`0 0 820 ${height}`} className="h-auto min-w-[680px] w-full" role="img" aria-label={`Jaringan pemegang saham ${code} dan saham lain dengan nama pemegang yang sama`}>
      {visible.map((holder, index) => <line key={`left-${holder.name}`} x1="182" y1={holderY(index)} x2="408" y2={height / 2} stroke="var(--color-rule-hi)" strokeWidth={selected === holder.name ? 3 : 1} />)}
      {relatedVisible.map((item, index) => <line key={`right-${item.code}`} x1="412" y1={height / 2} x2="638" y2={relatedY(index)} stroke="var(--color-rule-hi)" strokeWidth={selected && item.shared.some((name) => name.toUpperCase() === selected.toUpperCase()) ? 3 : 1} />)}
      <circle cx="410" cy={height / 2} r="31" fill="var(--color-amber)" /><text x="410" y={height / 2 + 4} textAnchor="middle" fontSize="15" fontWeight="bold" fill="var(--color-void)">{code}</text>
      {visible.map((holder, index) => <g key={holder.name} role="button" tabIndex={0} aria-label={`${holder.name} ${holder.percentage}%`} onClick={() => setSelected(selected === holder.name ? null : holder.name)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(selected === holder.name ? null : holder.name); } }} className="cursor-pointer"><circle cx="180" cy={holderY(index)} r={selected === holder.name ? 12 : 8} fill="var(--color-cyan)" /><text x="164" y={holderY(index) + 4} textAnchor="end" fontSize="10" fill="var(--color-ink)">{holder.name.length > 24 ? `${holder.name.slice(0, 24)}…` : holder.name}</text></g>)}
      {relatedVisible.map((item, index) => <a key={item.code} href={`/overview/${item.code}`}><circle cx="640" cy={relatedY(index)} r="8" fill="var(--color-up)" /><text x="656" y={relatedY(index) + 4} fontSize="11" fill="var(--color-ink-hi)">{item.code}</text></a>)}
    </svg></div>
    <p className="border-t border-rule px-3 py-2 text-micro leading-relaxed text-dim">Garis ke saham lain berarti ada nama pemegang saham yang identik dalam snapshot. Hubungan ini bukan bukti afiliasi, pengendalian, atau kepemilikan manfaat.</p>
    {selected && <div className="border-t border-rule px-3 py-2 text-xs text-ink">{selected}: {related.some((item) => item.shared.some((name) => name.toUpperCase() === selected.toUpperCase())) ? related.filter((item) => item.shared.some((name) => name.toUpperCase() === selected.toUpperCase())).map((item) => <Link key={item.code} href={`/overview/${item.code}`} className="mr-2 text-cyan hover:underline">{item.code}</Link>) : "—"}</div>}
  </div>;
}
