import Link from "next/link";
import { ArrowUpRight, Globe2, Network } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import { formatResearchPeriod } from "@/lib/intelligence/period";
import { INDONESIA_INDEX_SNAPSHOTS, type IndonesiaIndexSnapshot } from "@/lib/index-exposure";

const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const capDate = (value: string) => {
  const [year, month] = value.split("-");
  return formatResearchPeriod(`${year}-${month}`);
};

function marketCap(snapshot: IndonesiaIndexSnapshot, cap: number) {
  if (snapshot.marketCapUnit === "USD_BILLION") return `US$ ${number.format(cap)} miliar`;
  return `Rp ${number.format(cap / 1_000_000)} T`;
}

function indexCap(snapshot: IndonesiaIndexSnapshot) {
  if (snapshot.marketCapUnit === "USD_BILLION") return `US$ ${number.format(snapshot.indexMarketCap)} miliar`;
  return `Rp ${number.format(snapshot.indexMarketCap / 1_000_000)} kuadriliun`;
}

function IndexNetwork({ snapshot }: { snapshot: IndonesiaIndexSnapshot }) {
  return <article className="min-w-0 border border-rule bg-panel">
    <header className="border-b border-rule bg-panel-hi p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center border border-amber/40 bg-amber/10 text-amber"><Globe2 className="h-5 w-5" /></span><div className="min-w-0"><p className="text-micro font-bold uppercase tracking-widest text-cyan">{snapshot.provider}</p><h3 className="mt-1 text-sm font-bold text-ink-hi">{snapshot.title}</h3><p className="mt-1 text-micro text-dim">Snapshot {capDate(snapshot.snapshotDate)} · {snapshot.totalConstituents} saham</p></div></div>
        <div className="text-right"><p className="text-micro uppercase tracking-widest text-dim">Kapitalisasi indeks</p><p className="mt-1 text-sm font-bold tabular-nums text-ink-hi">{indexCap(snapshot)}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-micro"><span className="inline-flex items-center gap-1 border border-cyan/40 bg-cyan/10 px-2 py-1 font-bold text-cyan"><Network className="h-3 w-3" /> Indonesia · 100% indeks lokal</span><span className="border border-rule-hi px-2 py-1 text-dim">{snapshot.constituents.length} teratas · {number.format(snapshot.topWeightPct)}% bobot</span></div>
    </header>
    <div className="px-3 py-4 sm:px-5">
      <div className="mb-3 flex items-center gap-2 rounded border border-rule-hi bg-void px-3 py-2 text-xs"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-amber/50 bg-amber/10 text-[10px] font-bold text-amber">ID</span><div><strong className="text-ink-hi">Indonesia</strong><span className="ml-2 text-micro text-dim">konstituen dalam benchmark</span></div><span className="ml-auto text-xs font-bold text-amber">100%</span></div>
      <ol className="relative ml-3 space-y-1 border-l border-cyan/40 pl-4">
        {snapshot.constituents.map((stock) => <li key={stock.code} className="relative min-w-0 before:absolute before:-left-[17px] before:top-5 before:h-px before:w-3 before:bg-cyan/50">
          <article className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 border border-rule/70 px-2.5 py-2.5 hover:border-rule-hi sm:grid-cols-[minmax(0,1fr)_minmax(4rem,0.45fr)_auto] sm:px-3">
            <Link href={`/asset/${stock.code}`} className="flex min-w-0 items-center gap-2.5" aria-label={`Buka detail saham ${stock.code}`}><CompanyLogo code={stock.code} size="md" /><span className="min-w-0"><span className="flex flex-wrap items-center gap-x-2"><strong className="text-xs font-bold text-cyan">{stock.code}</strong><span className="truncate text-micro text-ink-hi">{stock.name}</span></span><span className="mt-0.5 block truncate text-micro text-dim">{stock.sector}</span></span></Link>
            <div className="col-span-2 row-start-2 h-1 overflow-hidden rounded-full bg-panel-hi sm:col-span-1 sm:row-start-1"><div className="h-full rounded-full bg-cyan" style={{ width: `${Math.max(2, Math.min(100, stock.weightPct / snapshot.topWeightPct * 100))}%` }} /></div>
            <div className="row-start-1 text-right sm:col-start-3"><strong className="block text-xs tabular-nums text-amber">{number.format(stock.weightPct)}%</strong><span className="block text-micro tabular-nums text-dim">{marketCap(snapshot, stock.capValue)}</span></div>
          </article>
        </li>)}
      </ol>
    </div>
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-3 text-micro"><span className="text-dim">{snapshot.capLabel} · data per {capDate(snapshot.snapshotDate)}</span><a href={snapshot.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan hover:underline">Factsheet resmi <ArrowUpRight className="h-3 w-3" /></a></footer>
  </article>;
}

export function IndexExposureNetwork() {
  return <section className="border-b border-rule bg-panel" aria-labelledby="index-network-title">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <p className="text-micro font-bold uppercase tracking-widest text-amber">Peta indeks · komposisi resmi</p>
      <h2 id="index-network-title" className="mt-1 flex items-center gap-2 font-display text-lg font-bold text-ink-hi"><Network className="h-5 w-5 text-amber" /> Bobot Indonesia & saham konstituen</h2>
      <p className="mt-2 max-w-4xl text-xs leading-5 text-ink">Peta menghubungkan benchmark Indonesia ke emiten dan bobotnya sesuai factsheet resmi. Nilai di samping saham adalah kapitalisasi pasar yang dilaporkan penyedia indeks, bukan jumlah dana ETF, kepemilikan aktual investor, atau arus beli asing.</p>
      <p className="mt-2 max-w-4xl text-micro leading-5 text-dim">MSCI EM tidak merinci bobot Indonesia secara terpisah pada factsheet publik yang kami temukan; Indonesia masuk kelompok “Others”. Data MSCI Indonesia bertanggal 30 Sep 2026. Factsheet FTSE Indonesia terbaru yang berhasil diakses bertanggal 29 Mei 2026, sehingga snapshot FTSE ini lebih lama.</p>
    </header>
    <div className="grid gap-px bg-rule xl:grid-cols-2">{INDONESIA_INDEX_SNAPSHOTS.map((snapshot) => <IndexNetwork key={snapshot.provider} snapshot={snapshot} />)}</div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-rule px-4 py-3 text-micro sm:px-6"><a href="https://www.msci.com/indexes/index/891800/msci-em-emerging-markets-index-2" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Profil MSCI Emerging Markets ↗</a><a href="https://research.ftserussell.com/analytics/factsheets" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Arsip factsheet FTSE Russell ↗</a><span className="text-dim">Publikasi/redistribusi data dapat tunduk pada lisensi penyedia.</span></div>
  </section>;
}
