"use client";

import { useState } from "react";
import type { FloatHolderAssessment } from "@/lib/free-float-research";

const groups = [
  { key: "verified-affiliate", title: "Afiliasi terverifikasi", color: "#f6a623", note: "Ada dokumen yang mendukung hubungan dengan emiten." },
  { key: "type-strategic", title: "Strategis menurut jenis investor", color: "#46b9cb", note: "Dikecualikan dari model float berdasarkan kategori investor; hubungan afiliasi belum tentu ada." },
  { key: "unverified", title: "Afiliasi belum terverifikasi", color: "#8999ad", note: "Tidak ada bukti afiliasi dalam data ini. Ini tidak berarti independen atau pasti beredar bebas." },
] as const;

const percent = (value: number) => `${value.toLocaleString("id-ID", { maximumFractionDigits: 3 })}%`;

export function FloatHolderBubbles({ holders }: { holders: FloatHolderAssessment[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = holders.find((holder) => `${holder.name}:${holder.shares}` === selected);

  if (!holders.length) return <p className="p-5 text-xs text-dim">Snapshot pemegang saham ≥1% belum tersedia untuk ticker ini.</p>;

  return <div className="min-w-0">
    <div className="grid min-w-0 gap-4 p-4 lg:grid-cols-3">
      {groups.map((group) => {
        const members = holders.filter((holder) => holder.treatment === group.key);
        return <section key={group.key} className="min-w-0 border border-rule-hi bg-void/30 p-3">
          <div className="flex items-start justify-between gap-2"><h3 className="text-xs font-bold text-ink-hi">{group.title}</h3><span className="text-micro tabular-nums text-dim">{members.length}</span></div>
          <p className="mt-1 min-h-10 text-micro leading-relaxed text-dim">{group.note}</p>
          {members.length ? <div className="mt-3 flex min-h-36 flex-wrap items-center justify-center gap-2" role="group" aria-label={group.title}>
            {members.map((holder) => {
              const key = `${holder.name}:${holder.shares}`;
              const diameter = Math.max(68, Math.min(162, Math.round(52 + Math.sqrt(holder.percentage) * 12)));
              return <button key={key} type="button" onClick={() => setSelected(selected === key ? null : key)}
                aria-pressed={selected === key} aria-label={`${holder.name}, ${percent(holder.percentage)}, ${group.title}`}
                title={`${holder.name} · ${percent(holder.percentage)}`}
                style={{ width: diameter, height: diameter, borderColor: group.color, backgroundColor: `${group.color}1c` }}
                className="flex shrink-0 flex-col items-center justify-center rounded-full border-2 p-1.5 text-center transition-colors hover:bg-panel-hi focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber aria-pressed:ring-2 aria-pressed:ring-amber">
                <strong className="max-w-full overflow-hidden text-ellipsis text-[10px] leading-tight text-ink-hi [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{holder.name}</strong>
                <span className="mt-1 text-xs font-bold tabular-nums" style={{ color: group.color }}>{percent(holder.percentage)}</span>
              </button>;
            })}
          </div> : <p className="mt-3 border border-dashed border-rule px-3 py-4 text-micro text-dim">Belum ada posisi dalam kelompok ini.</p>}
        </section>;
      })}
    </div>
    {active && <div aria-live="polite" className="border-t border-rule bg-panel-hi px-4 py-3 text-xs leading-relaxed">
      <strong className="block break-words text-ink-hi">{active.name}</strong>
      <span className="mt-1 block text-ink">{percent(active.percentage)} · {active.shares.toLocaleString("id-ID")} saham · {active.investorType || "Jenis investor tidak tercatat"}</span>
      {active.affiliation ? <a href={active.affiliation.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-cyan hover:underline">Bukti: {active.affiliation.label} ↗</a> : <span className="mt-1 block text-dim">Hubungan dengan emiten belum dibuktikan dari sumber yang tersedia.</span>}
    </div>}
  </div>;
}
