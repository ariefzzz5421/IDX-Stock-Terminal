"use client";

import { useState } from "react";

export type HolderNetwork = {
  name: string;
  investorType: string;
  typeCode: string;
  localForeign: string;
  domicile: string;
  positions: { code: string; percentage: number; shares: number; assetAvailable: boolean }[];
};

const pct = (value: number) => `${value.toLocaleString("id-ID", { maximumFractionDigits: 3 })}%`;
const stable = (value: number) => Number(value.toFixed(3));

export function FloatOwnershipNetwork({ holders }: { holders: HolderNetwork[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusedCode, setFocusedCode] = useState<string | null>(null);
  if (!holders.length) return <p className="p-5 text-xs text-dim">Jaringan belum dapat dibuat karena data pemegang saham ≥1% tidak tersedia.</p>;

  const selected = holders[Math.min(selectedIndex, holders.length - 1)];
  const visible = selected.positions.slice(0, 12);
  const focused = selected.positions.find((position) => position.code === focusedCode) ?? visible[0];
  const nodes = visible.map((position, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / visible.length;
    return {
      ...position,
      x: stable(360 + Math.cos(angle) * (visible.length < 4 ? 205 : 247)),
      y: stable(220 + Math.sin(angle) * (visible.length < 4 ? 130 : 157)),
      radius: stable(Math.max(23, Math.min(41, 20 + Math.sqrt(position.percentage) * 2.2))),
    };
  });

  return <div className="min-w-0">
    <div className="flex flex-col gap-2 border-b border-rule bg-panel-hi px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-6">
      <label htmlFor="network-holder" className="text-xs font-semibold text-ink-hi">Pilih pemegang</label>
      <div className="flex min-w-0 items-center gap-2 sm:max-w-lg sm:flex-1"><select id="network-holder" value={selectedIndex} onChange={(event) => { setSelectedIndex(Number(event.target.value)); setFocusedCode(null); }} className="min-h-11 min-w-0 flex-1 border border-rule-hi bg-void px-3 text-xs text-ink-hi">
        {holders.map((holder, index) => <option key={`${holder.name}-${index}`} value={index}>{holder.name} · {holder.positions.length} saham</option>)}
      </select><span className="border border-cyan/40 px-2 py-1 text-micro font-bold text-cyan">{selected.typeCode}</span></div>
      <span className="text-micro text-dim">{selected.investorType || "Jenis N/D"} · {selected.localForeign === "L" ? "Lokal" : selected.localForeign === "F" ? "Asing" : "L/F N/D"} · {selected.domicile || "Domisili N/D"}</span>
    </div>
    <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,3fr)_minmax(14rem,1fr)]">
      <div className="min-w-0 overflow-x-auto p-3" aria-label={`Jaringan kepemilikan ${selected.name}`}>
        <p className="mb-2 text-micro text-dim lg:hidden">Geser peta untuk melihat semua saham →</p>
        <svg viewBox="0 0 720 440" className="mx-auto h-auto min-w-[560px] max-w-[820px]" role="img" aria-label={`${selected.name} tercatat pada ${selected.positions.length} saham`}>
          {nodes.map((node) => <line key={`line-${node.code}`} x1="360" y1="220" x2={node.x} y2={node.y} stroke={focusedCode === node.code ? "#f6a623" : "#637588"} strokeWidth={stable(Math.max(1.5, Math.min(8, 1 + node.percentage / 12)))} opacity="0.75" />)}
          <circle cx="360" cy="220" r="58" fill="#21483c" stroke="#58cba0" strokeWidth="2" />
          <text x="360" y="216" textAnchor="middle" fill="#e9f4ef" fontSize="12" fontWeight="bold">PEMEGANG</text>
          <text x="360" y="233" textAnchor="middle" fill="#a4cfbe" fontSize="11">{selected.typeCode}</text>
          {nodes.map((node) => <a key={node.code} href={node.assetAvailable ? `/asset/${node.code}` : undefined} aria-label={`${node.code}, ${pct(node.percentage)} milik ${selected.name}`} onMouseEnter={() => setFocusedCode(node.code)} onFocus={() => setFocusedCode(node.code)} onClick={() => setFocusedCode(node.code)} className={node.assetAvailable ? "cursor-pointer" : "cursor-default"}>
            <circle cx={node.x} cy={node.y} r={node.radius} fill="#603714" stroke={focusedCode === node.code ? "#ffe0a4" : "#f6a623"} strokeWidth={focusedCode === node.code ? 3 : 2} />
            <text x={node.x} y={node.y + 1} textAnchor="middle" fill="#fff2da" fontSize="13" fontWeight="bold">{node.code}</text>
            <text x={node.x} y={node.y + 16} textAnchor="middle" fill="#fdd18d" fontSize="10">{pct(node.percentage)}</text>
          </a>)}
        </svg>
      </div>
      <div className="min-w-0 border-t border-rule p-4 text-xs lg:border-l lg:border-t-0 sm:p-6">
        <p className="text-micro uppercase tracking-wider text-dim">Investor</p><strong className="mt-1 block break-words text-sm text-ink-hi">{selected.name}</strong>
        <p className="mt-4 text-micro uppercase tracking-wider text-dim">Posisi dipilih</p>
        {focused ? <div className="mt-1"><strong className="block text-lg tabular-nums text-amber">{focused.code} · {pct(focused.percentage)}</strong><span className="block tabular-nums text-ink">{focused.shares.toLocaleString("id-ID")} saham</span>{focused.assetAvailable && <a href={`/asset/${focused.code}`} className="mt-2 inline-block text-cyan hover:underline">Buka profil {focused.code} ↗</a>}</div> : <p className="mt-1 text-dim">Posisi tidak tersedia.</p>}
        <p className="mt-4 text-micro leading-relaxed text-dim">Garis menandai nama pemegang yang sama dalam snapshot. Ketebalan mengikuti persentase posisi; garis ini bukan bukti afiliasi antar emiten.</p>
      </div>
    </div>
    {selected.positions.length > visible.length && <div className="border-t border-rule px-4 py-3 text-xs sm:px-6"><p className="mb-2 text-micro uppercase tracking-wider text-dim">Posisi lain dalam snapshot</p><div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">{selected.positions.slice(visible.length).map((position) => position.assetAvailable ? <a key={position.code} href={`/asset/${position.code}`} className="border border-rule-hi px-2 py-1.5 text-cyan hover:border-cyan">{position.code} · {pct(position.percentage)}</a> : <span key={position.code} className="border border-rule px-2 py-1.5 text-dim">{position.code} · {pct(position.percentage)}</span>)}</div></div>}
  </div>;
}
