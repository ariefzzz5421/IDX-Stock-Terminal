import { ExternalLink } from "lucide-react";
import { formatVolume } from "@/lib/format";
import { HoldingPieChart } from "./HoldingPieChart";
import { OWNERSHIP_AS_OF, OWNERSHIP_DOCUMENT, OWNERSHIP_SOURCE, type NamedShareholder } from "@/lib/shareholders";

export function ShareholderList({ holders }: { holders: NamedShareholder[] }) {
  return (
    <div className="mt-5 border-t border-rule pt-4">
      <h3 className="text-micro font-semibold uppercase tracking-[0.12em] text-amber">Pemegang saham ≥1%</h3>
      <p className="mt-2 text-xs leading-relaxed text-dim">Data KSEI/BEI per {OWNERSHIP_AS_OF}. Kepemilikan bisa berubah setelah tanggal tersebut. Status afiliasi hanya diberi label jika didukung dokumen perusahaan.</p>
      <HoldingPieChart holders={holders} />
      {holders.length ? (
        <details className="mt-3 border border-rule-hi bg-panel-hi" open>
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-ink-hi">Lihat {holders.length} pemegang saham</summary>
          <ol className="max-h-96 overflow-y-auto border-t border-rule">
            {holders.map((holder, index) => (
              <li key={`${holder.name}-${index}`} className="flex flex-wrap items-start gap-x-3 gap-y-1 border-b border-rule/70 px-3 py-2 text-xs last:border-0">
                <span className="w-5 shrink-0 text-dim">{index + 1}</span>
                <span className="min-w-[8rem] flex-1 break-words text-ink-hi">{holder.name}<span className="ml-2 text-dim">{holder.investorType}</span></span>
                <span className="text-right tabular-nums text-amber">{holder.percentage.toLocaleString("id-ID", { maximumFractionDigits: 4 })}%<span className="block text-[10px] text-dim">{formatVolume(holder.shares)} saham</span></span>
                <span className="w-full pl-8 text-[10px]">
                  {holder.affiliation ? <a href={holder.affiliation.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 border border-amber/50 px-1.5 py-0.5 text-amber hover:underline">{holder.affiliation.label}<ExternalLink className="h-2.5 w-2.5" aria-hidden="true" /></a> : <span className="text-dim">Afiliasi pendiri belum terverifikasi</span>}
                </span>
              </li>
            ))}
          </ol>
        </details>
      ) : <p className="mt-3 text-xs text-dim">Tidak ada rincian ≥1% untuk ticker ini dalam snapshot tersebut.</p>}
      <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-dim">
        <a href={OWNERSHIP_SOURCE} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Sumber BEI/KSEI ↗</a>
        <a href={OWNERSHIP_DOCUMENT} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Laporan XLSX resmi ↗</a>
      </p>
    </div>
  );
}
