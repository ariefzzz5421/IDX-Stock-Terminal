import Link from "next/link";
import { ArrowUpRight, BookOpen, Download, ExternalLink, Network } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import { IndexExposurePie } from "./IndexExposurePie";
import { FX_REFERENCE, INDEX_FUND_SNAPSHOTS, INDONESIA_INDEX_SNAPSHOTS, type IndonesiaIndexSnapshot } from "@/lib/index-exposure";
import type { ForeignFlowResult } from "@/lib/foreign-flow";

const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const usd = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const exactDate = (value: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
const usdCap = (value: number) => `$${usd.format(value)}B`;
const usdToIdrT = (usdBillion: number) => usdBillion * FX_REFERENCE.usdIdr / 1_000;
const idrT = (value: number) => `Rp ${number.format(value)} T`;

function marketCap(snapshot: IndonesiaIndexSnapshot, cap: number) {
  if (snapshot.marketCapUnit === "USD_BILLION") return <><span>{usdCap(cap)}</span><span className="mt-0.5 block text-[10px] text-dim">≈ {idrT(usdToIdrT(cap))}</span></>;
  return <span>Rp {number.format(cap / 1_000_000)} T</span>;
}

function indexCap(snapshot: IndonesiaIndexSnapshot) {
  if (snapshot.marketCapUnit === "USD_BILLION") return <><span>{usdCap(snapshot.indexMarketCap)}</span><span className="mt-0.5 block text-[10px] font-normal text-dim">≈ {idrT(usdToIdrT(snapshot.indexMarketCap))}</span></>;
  return <span>Rp {number.format(snapshot.indexMarketCap / 1_000_000_000)} kuadriliun</span>;
}

function ProviderMark({ provider }: { provider: "MSCI" | "FTSE Russell" }) {
  return <span className={`grid h-11 min-w-14 shrink-0 place-items-center px-2 text-[11px] font-black tracking-tight ${provider === "MSCI" ? "bg-[#0876b9] text-white" : "bg-[#ecf3fa] text-[#24465f]"}`} aria-label={`${provider} official provider`}>{provider === "MSCI" ? "MSCI" : <span className="text-center leading-3">FTSE<br />RUSSELL</span>}</span>;
}

function IndexNetwork({ snapshot, flow }: { snapshot: IndonesiaIndexSnapshot; flow: ForeignFlowResult }) {
  const latestWeight = snapshot.provider === "FTSE Russell" ? "0,76%" : "100%*";
  return <article className="min-w-0 border border-rule bg-panel">
    <header className="border-b border-rule bg-panel-hi p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3"><ProviderMark provider={snapshot.provider} /><div className="min-w-0"><p className="text-micro font-bold uppercase tracking-widest text-cyan">Official index · {snapshot.provider}</p><h3 className="mt-1 text-sm font-bold text-ink-hi">{snapshot.title}</h3><p className="mt-1 text-micro text-dim">Data terakhir {exactDate(snapshot.snapshotDate)} · {snapshot.totalConstituents} saham</p></div></div>
        <div className="min-w-32 text-right"><p className="text-micro uppercase tracking-widest text-dim">Kapitalisasi indeks</p><p className="mt-1 text-sm font-bold tabular-nums text-ink-hi">{indexCap(snapshot)}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-micro"><span className="inline-flex items-center gap-1 border border-cyan/40 bg-cyan/10 px-2 py-1 font-bold text-cyan"><Network className="h-3 w-3" /> Indonesia · {snapshot.provider === "FTSE Russell" ? `${latestWeight} bobot di FTSE Emerging` : `${latestWeight} benchmark lokal`}</span><span className="border border-rule-hi px-2 py-1 text-dim">{snapshot.constituents.length} konstituen ditampilkan · {number.format(snapshot.topWeightPct)}% bobot</span></div>
    </header>
    <IndexExposurePie snapshot={snapshot} flow={flow} />
    <div className="px-3 py-4 sm:px-5">
      <div className="mb-3 flex items-center gap-2 rounded border border-rule-hi bg-void px-3 py-2 text-xs"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-amber/50 bg-amber/10 text-[10px] font-bold text-amber">ID</span><div><strong className="text-ink-hi">Indonesia</strong><span className="ml-2 text-micro text-dim">{snapshot.provider === "FTSE Russell" ? "bobot pada FTSE Emerging Index" : "benchmark Indonesia mandiri"}</span></div><span className="ml-auto text-xs font-bold text-amber">{latestWeight}</span></div>
      <ol className="relative ml-3 space-y-1 border-l border-cyan/40 pl-4">
        {snapshot.constituents.map((stock) => <li key={stock.code} className="relative min-w-0 before:absolute before:-left-[17px] before:top-5 before:h-px before:w-3 before:bg-cyan/50">
          <details className="group min-w-0 border border-rule/70 open:border-cyan/50 hover:border-rule-hi">
            <summary className="grid cursor-pointer list-none min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 px-2.5 py-2.5 marker:hidden sm:grid-cols-[minmax(0,1fr)_minmax(4rem,0.45fr)_auto] sm:px-3">
              <Link href={`/asset/${stock.code}`} className="flex min-w-0 items-center gap-2.5" aria-label={`Buka detail saham ${stock.code}`}><CompanyLogo code={stock.code} size="md" /><span className="min-w-0"><span className="flex flex-wrap items-center gap-x-2"><strong className="text-xs font-bold text-cyan">{stock.code}</strong><span className="truncate text-micro text-ink-hi">{stock.name}</span></span><span className="mt-0.5 block truncate text-micro text-dim">{stock.sector}</span></span></Link>
              <span aria-hidden="true" className="col-span-2 row-start-2 h-1 overflow-hidden rounded-full bg-panel-hi sm:col-span-1 sm:row-start-1"><span className="block h-full rounded-full bg-gradient-to-r from-cyan to-amber transition-[width] duration-300 group-open:brightness-125" style={{ width: `${Math.max(2, Math.min(100, stock.weightPct / snapshot.topWeightPct * 100))}%` }} /></span>
              <span className="row-start-1 text-right sm:col-start-3"><strong className="block text-xs tabular-nums text-amber">{number.format(stock.weightPct)}%</strong><span className="block text-micro tabular-nums text-dim">{marketCap(snapshot, stock.capValue)}</span></span>
            </summary>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule bg-panel-hi/60 px-3 py-2 text-micro text-dim"><span>Bobot relatif dalam {snapshot.title}; nilai pasar free-float sesuai snapshot provider.</span><Link href={`/asset/${stock.code}`} className="inline-flex items-center gap-1 font-bold text-cyan hover:underline">Profil {stock.code} <ArrowUpRight className="h-3 w-3" /></Link></div>
          </details>
        </li>)}
      </ol>
      {snapshot.provider === "MSCI" && <p className="mt-3 text-[10px] leading-4 text-dim">* 100% berarti benchmark MSCI Indonesia mengukur pasar Indonesia, bukan Indonesia memiliki 100% bobot dalam MSCI Emerging Markets.</p>}
    </div>
    <div className="border-t border-rule">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-cyan hover:bg-panel-hi sm:px-5"><span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" /> Baca dokumen resmi & data sumber</span><span className="text-micro text-dim group-open:hidden">Buka</span><span className="hidden text-micro text-dim group-open:inline">Tutup</span></summary>
        <div className="space-y-3 border-t border-rule p-4 sm:p-5">
          <p className="text-micro text-dim">Rilis data: {exactDate(snapshot.snapshotDate)}. Kapitalisasi pada kartu adalah nilai pasar konstituen, bukan jumlah dana yang membeli saham.</p>
          <div className="flex flex-wrap gap-2"><a href={snapshot.indexUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 border border-cyan/50 px-3 py-2 text-xs text-cyan hover:bg-cyan/10"><BookOpen className="h-4 w-4" /> Baca data/profile terbaru <ExternalLink className="h-3 w-3" /></a><a href={snapshot.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 border border-rule-hi px-3 py-2 text-xs text-ink hover:border-amber"><Download className="h-4 w-4" /> Factsheet PDF · {exactDate(snapshot.pdfDate)} <ArrowUpRight className="h-3 w-3" /></a></div>
          {snapshot.sourceUrl.endsWith(".pdf") && <iframe title={`${snapshot.provider} ${snapshot.title} official index factsheet`} src={`${snapshot.sourceUrl}#view=FitH`} className="h-[26rem] w-full border border-rule bg-white" loading="lazy" />}
        </div>
      </details>
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

export function IndexExposureNetwork({ flow }: { flow: ForeignFlowResult }) {
  return <section className="border-b border-rule bg-panel" aria-labelledby="index-network-title">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <p className="text-micro font-bold uppercase tracking-widest text-amber">Index intelligence · sumber resmi</p>
      <h2 id="index-network-title" className="mt-1 flex items-center gap-2 font-display text-lg font-bold text-ink-hi"><Network className="h-5 w-5 text-amber" /> Bobot Indonesia, konstituen & dana pelacak</h2>
      <p className="mt-2 max-w-5xl text-xs leading-5 text-ink">Pilih baris saham untuk membuka rincian dan profil asetnya. Bobot indeks dan kapitalisasi pasar adalah data benchmark; AUM adalah ukuran dana ETF yang disebutkan, bukan aset milik MSCI atau FTSE Russell dan bukan arus transaksi asing.</p>
      <p className="mt-2 max-w-5xl text-micro leading-5 text-dim">MSCI Indonesia: data 30 Sep 2026. FTSE Indonesia dan FTSE Emerging: data 29 Mei 2026. Bobot FTSE Emerging untuk Indonesia 0,76%; bobot MSCI EM tidak dipisahkan pada tabel publik yang diperiksa. Konversi USD memakai JISDOR BI 12 Okt 2026: Rp{number.format(FX_REFERENCE.usdIdr)}/US$.</p>
    </header>
    <div className="grid gap-px bg-rule xl:grid-cols-2">{INDONESIA_INDEX_SNAPSHOTS.map((snapshot) => <IndexNetwork key={snapshot.provider} snapshot={snapshot} flow={flow} />)}</div>
    <div className="border-t border-rule bg-panel-hi px-4 py-4 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-micro font-bold uppercase tracking-widest text-amber">Dana pelacak · AUM resmi</p><h3 className="mt-1 text-sm font-bold text-ink-hi">Contoh ETF yang mengikuti benchmark terkait</h3></div><span className="text-[10px] text-dim">Nilai IDR = AUM USD × kurs JISDOR BI</span></div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">{INDEX_FUND_SNAPSHOTS.map((fund) => <AumCard key={fund.ticker} fund={fund} />)}</div>
      <p className="mt-3 max-w-5xl text-[10px] leading-4 text-dim">Snapshot AUM berasal dari tanggal berbeda sesuai publikasi tiap manajer dana. Nilai “EST” adalah konversi kurs, bukan aset rupiah yang dilaporkan. Bobot benchmark FTSE Emerging 0,76% tidak dipakai sebagai bobot aktual VWO; untuk EEM, angka Indonesia tidak tersedia terpisah dari kategori Other pada tabel yang diperiksa.</p>
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-rule px-4 py-3 text-micro sm:px-6"><a href="https://www.msci.com/indexes/index/891800/msci-em-emerging-markets-index-2" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Profil MSCI Emerging Markets ↗</a><a href="https://research.ftserussell.com/Analytics/FactSheets/temp/66e55299-fd35-4342-87f5-a3ef6b24c547.pdf" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Baca / unduh FTSE Emerging factsheet ↗</a><a href={FX_REFERENCE.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Kurs resmi JISDOR BI ↗</a><span className="text-dim">Distribusi dokumen tunduk pada lisensi penyedia.</span></div>
  </section>;
}
