import { ArrowUpRight, BookOpen, Download, ExternalLink, Network } from "lucide-react";
import { IndexExposurePie } from "./IndexExposurePie";
import { IndexExposureBars } from "./IndexExposureBars";
import { FX_REFERENCE, INDEX_FUND_SNAPSHOTS, INDONESIA_INDEX_SNAPSHOTS, type IndonesiaIndexSnapshot } from "@/lib/index-exposure";

const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const usd = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const exactDate = (value: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
const usdCap = (value: number) => `$${usd.format(value)}B`;
const usdToIdrT = (usdBillion: number) => usdBillion * FX_REFERENCE.usdIdr / 1_000;
const idrT = (value: number) => `Rp ${number.format(value)} T`;

function indexCap(snapshot: IndonesiaIndexSnapshot) {
  if (snapshot.marketCapUnit === "USD_BILLION") return <><span>{usdCap(snapshot.indexMarketCap)}</span><span className="mt-0.5 block text-[10px] font-normal text-dim">≈ {idrT(usdToIdrT(snapshot.indexMarketCap))}</span></>;
  return <span>Rp {number.format(snapshot.indexMarketCap / 1_000_000_000)} kuadriliun</span>;
}

function ProviderMark({ provider }: { provider: "MSCI" | "FTSE Russell" }) {
  return <span className={`grid h-11 min-w-14 shrink-0 place-items-center px-2 text-[11px] font-black tracking-tight ${provider === "MSCI" ? "bg-[#0876b9] text-white" : "bg-[#ecf3fa] text-[#24465f]"}`} aria-label={`${provider} official provider`}>{provider === "MSCI" ? "MSCI" : <span className="text-center leading-3">FTSE<br />RUSSELL</span>}</span>;
}

function IndexNetwork({ snapshot }: { snapshot: IndonesiaIndexSnapshot }) {
  const latestWeight = `${snapshot.countryWeightMethod === "derived" ? "≈" : ""}${number.format(snapshot.countryWeightPct)}%`;
  return <article className="min-w-0 border border-rule bg-panel">
    <header className="border-b border-rule bg-panel-hi p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3"><ProviderMark provider={snapshot.provider} /><div className="min-w-0"><p className="text-micro font-bold uppercase tracking-widest text-cyan">Official index · {snapshot.provider}</p><h3 className="mt-1 text-sm font-bold text-ink-hi">{snapshot.title}</h3><p className="mt-1 text-micro text-dim">Data terakhir {exactDate(snapshot.snapshotDate)} · {snapshot.totalConstituents} saham</p></div></div>
        <div className="min-w-32 text-right"><p className="text-micro uppercase tracking-widest text-dim">Kapitalisasi indeks</p><p className="mt-1 text-sm font-bold tabular-nums text-ink-hi">{indexCap(snapshot)}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-micro"><span className="inline-flex items-center gap-1 border border-cyan/40 bg-cyan/10 px-2 py-1 font-bold text-cyan"><Network className="h-3 w-3" /> Indonesia · {latestWeight} dari {snapshot.provider === "MSCI" ? "MSCI Emerging Markets" : "FTSE Emerging"}</span><span className="border border-rule-hi px-2 py-1 text-dim">{snapshot.constituents.length} konstituen ditampilkan · {number.format(snapshot.topWeightPct)}% bobot lokal</span></div>
    </header>
    <IndexExposurePie snapshot={snapshot} />
    <IndexExposureBars snapshot={snapshot} />
    <div className="border-t border-rule px-4 py-4 sm:px-5">
      <h4 className="inline-flex items-center gap-2 text-xs font-bold text-ink-hi"><BookOpen className="h-4 w-4 text-cyan" /> Riset dan data resmi · {exactDate(snapshot.snapshotDate)}</h4>
      <p className="mt-1 text-micro leading-5 text-dim">{snapshot.countryWeightMethod === "derived" ? `Bobot Indonesia ≈ ${number.format(snapshot.countryMarketCapUsdBillion)} ÷ ${number.format(snapshot.globalMarketCapUsdBillion)} (USD miliar); perkiraan dari kapitalisasi dua indeks MSCI pada tanggal yang sama.` : `Bobot Indonesia ${latestWeight} dan kapitalisasi US$${number.format(snapshot.countryMarketCapUsdBillion)}B diterbitkan langsung dalam factsheet FTSE Emerging.`} Nilai ini mengukur indeks, bukan dana yang masuk.</p>
      <div className="mt-3 flex flex-wrap gap-2"><a href={snapshot.indexUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 border border-cyan/50 px-3 py-2 text-xs text-cyan hover:bg-cyan/10"><BookOpen className="h-4 w-4" /> Indeks Indonesia · {exactDate(snapshot.snapshotDate)} <ExternalLink className="h-3 w-3" /></a><a href={snapshot.globalIndexUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 border border-cyan/50 px-3 py-2 text-xs text-cyan hover:bg-cyan/10"><BookOpen className="h-4 w-4" /> Indeks Emerging Markets · {exactDate(snapshot.snapshotDate)} <ExternalLink className="h-3 w-3" /></a><a href={snapshot.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 border border-rule-hi px-3 py-2 text-xs text-ink hover:border-amber"><Download className="h-4 w-4" /> Factsheet PDF · {exactDate(snapshot.pdfDate)} <ArrowUpRight className="h-3 w-3" /></a></div>
    </div>
  </article>;
}

function AumCard({ fund }: { fund: (typeof INDEX_FUND_SNAPSHOTS)[number] }) {
  const estimate = usdToIdrT(fund.aumUsdBillion);
  const aumDisplay = fund.aumUsdBillion < 1 ? `US$ ${number.format(fund.aumUsdBillion * 1_000)}M` : `US$ ${number.format(fund.aumUsdBillion)}B`;
  return <article className="min-w-0 border border-rule bg-panel p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-micro font-bold uppercase tracking-widest text-cyan">{fund.provider} · {fund.ticker}</p><h3 className="mt-1 text-sm font-bold text-ink-hi">{fund.mandate}</h3></div><a href={fund.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan" aria-label={`Sumber resmi AUM ${fund.ticker}`}><ExternalLink className="h-4 w-4" /></a></div>
    <p className="mt-4 text-[10px] uppercase tracking-widest text-dim">Total net assets · {exactDate(fund.asOf)}</p><p className="mt-1 font-display text-xl font-bold tabular-nums text-ink-hi">{aumDisplay}</p><p className="mt-0.5 text-xs font-semibold text-cyan">EST {idrT(estimate)} <span className="font-normal text-dim">· JISDOR {number.format(FX_REFERENCE.usdIdr)}/US$</span></p>
    <div className="mt-3 border-t border-rule pt-3"><p className="text-micro font-bold text-amber">Bobot / eksposur Indonesia: {fund.indonesiaWeight}</p><p className="mt-1 text-micro leading-5 text-dim">{fund.weightNote}</p><p className="mt-2 truncate text-[10px] text-dim">Benchmark: {fund.benchmark}</p></div>
    <div className="mt-3 flex flex-wrap gap-2"><a href={fund.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 border border-cyan/40 px-2.5 py-1.5 text-micro text-cyan hover:bg-cyan/10"><BookOpen className="h-3.5 w-3.5" /> Data terbaru</a><a href={fund.factsheetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 border border-rule-hi px-2.5 py-1.5 text-micro text-ink hover:border-amber"><Download className="h-3.5 w-3.5" /> Factsheet / PDF</a></div>
  </article>;
}

export function IndexExposureNetwork() {
  return <section className="border-b border-rule bg-panel" aria-labelledby="index-network-title">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <p className="text-micro font-bold uppercase tracking-widest text-amber">Index intelligence · sumber resmi</p>
      <h2 id="index-network-title" className="mt-1 flex items-center gap-2 font-display text-lg font-bold text-ink-hi"><Network className="h-5 w-5 text-amber" /> Bobot Indonesia, konstituen & dana pelacak</h2>
    </header>
    <div className="grid gap-px bg-rule xl:grid-cols-2">{INDONESIA_INDEX_SNAPSHOTS.map((snapshot) => <IndexNetwork key={snapshot.provider} snapshot={snapshot} />)}</div>
    <div className="border-t border-rule bg-panel-hi px-4 py-4 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-micro font-bold uppercase tracking-widest text-amber">Dana pelacak · AUM resmi</p><h3 className="mt-1 text-sm font-bold text-ink-hi">Contoh ETF yang mengikuti benchmark terkait</h3></div><span className="text-[10px] text-dim">Nilai IDR = AUM USD × kurs JISDOR BI</span></div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">{INDEX_FUND_SNAPSHOTS.map((fund) => <AumCard key={fund.ticker} fund={fund} />)}</div>
      <p className="mt-3 max-w-5xl text-[10px] leading-4 text-dim">Snapshot AUM berasal dari tanggal berbeda sesuai publikasi tiap manajer dana. Nilai “EST” adalah konversi kurs, bukan aset rupiah yang dilaporkan. Bobot benchmark FTSE Emerging 0,76% tidak dipakai sebagai bobot aktual VWO; untuk EEM, angka Indonesia tidak tersedia terpisah dari kategori Other pada tabel yang diperiksa.</p>
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-rule px-4 py-3 text-micro sm:px-6"><a href="https://www.msci.com/indexes/index/891800/msci-em-emerging-markets-index-2" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Profil MSCI Emerging Markets ↗</a><a href="https://research.ftserussell.com/Analytics/FactSheets/temp/66e55299-fd35-4342-87f5-a3ef6b24c547.pdf" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Baca / unduh FTSE Emerging factsheet ↗</a><a href={FX_REFERENCE.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Kurs resmi JISDOR BI ↗</a><span className="text-dim">Distribusi dokumen tunduk pada lisensi penyedia.</span></div>
  </section>;
}
