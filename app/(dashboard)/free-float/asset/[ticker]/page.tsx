import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { formatPrice, formatValue } from "@/lib/format";
import { assessFloatHolders } from "@/lib/free-float-research";
import { getFreeFloatSnapshot } from "@/lib/market-data/free-float";
import { sharedHolderLinks } from "@/lib/ownership-overview";
import { OWNERSHIP_AS_OF, OWNERSHIP_SOURCE, OWNERSHIP_TRANSCRIPTION, shareholdersFor } from "@/lib/shareholders";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";
import { FloatHolderBubbles } from "@/components/terminal/FloatHolderBubbles";

export const dynamic = "force-dynamic";

const count = (value: number) => Math.round(value).toLocaleString("id-ID");
const pct = (value: number | null) => value === null ? "N/D" : `${value.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const jakarta = (value: string | null) => value ? `${new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }).format(new Date(value))} WIB` : "Belum tersedia";

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }): Promise<Metadata> {
  const { ticker } = await params;
  return { title: `${ticker.toUpperCase()} Free Float — IDX Terminal` };
}

export default async function FreeFloatAssetPage({ params }: { params: Promise<{ ticker: string }> }) {
  await requireUser();
  const { ticker } = await params;
  const code = ticker.toUpperCase();
  if (!/^[A-Z0-9]{4,5}$/.test(code)) notFound();
  const company = getCompanyCatalogEntry(code);
  if (!company) notFound();

  const snapshot = await getFreeFloatSnapshot();
  const holders = shareholdersFor(code);
  const stock = snapshot.rows.find((row) => row.code === code);
  const research = assessFloatHolders(holders);
  const related = holders.length ? sharedHolderLinks(code) : [];
  const nonFloatShares = stock ? Math.max(0, stock.outstandingShares - stock.floatShares) : null;

  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <Link href="/free-float" className="inline-flex items-center gap-1 text-xs text-cyan hover:underline"><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Semua emiten</Link>
      <p className="mt-5 text-micro uppercase tracking-[0.18em] text-amber">Ownership intelligence / rincian float</p>
      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-3"><CompanyLogo code={code} size="lg" /><div className="min-w-0"><h1 className="font-display text-2xl font-bold text-ink-hi">{code} <span className="text-base font-normal text-dim">Free Float</span></h1><p className="break-words text-xs text-ink">{company.name}</p></div></div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><Link href={`/asset/${code}`} className="inline-flex min-h-10 items-center gap-1 border border-cyan/50 px-3 text-xs font-bold text-cyan hover:bg-cyan/10">${code} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">Lihat halaman saham {code}</span></Link><span className="text-micro text-dim">Klik tag untuk harga, grafik, dan informasi saham.</span></div>
    </header>

    <section className="grid grid-cols-2 border-b border-rule bg-panel-hi sm:grid-cols-4" aria-label="Ringkasan free float">
      {[
        ["Float vendor", stock ? pct(stock.floatPercent) : "N/D"],
        ["Saham float", stock ? count(stock.floatShares) : "N/D"],
        ["Saham beredar", stock ? count(stock.outstandingShares) : "N/D"],
        ["Harga katalog vendor", stock?.lastPrice ? `Rp ${formatPrice(stock.lastPrice)}` : "N/D"],
      ].map(([label, value]) => <div key={label} className="min-w-0 border-b border-r border-rule px-4 py-3 sm:border-b-0 sm:px-6"><span className="block text-micro uppercase tracking-wider text-dim">{label}</span><strong className="mt-1 block break-words font-display text-base tabular-nums text-ink-hi">{value}</strong></div>)}
    </section>

    <div className="grid min-w-0 xl:grid-cols-[minmax(0,3fr)_minmax(18rem,1fr)]">
      <div className="min-w-0 border-b border-rule xl:border-r">
        <section className="border-b border-rule">
          <div className="border-b border-rule bg-panel-hi px-4 py-3 sm:px-6"><h2 className="text-xs font-bold uppercase tracking-wider text-amber">Peta bubble pemegang saham</h2><p className="mt-1 text-micro text-dim">Ukuran bubble mengikuti besar posisi secara indikatif. Pilih bubble untuk melihat detail dan sumber hubungan.</p></div>
          <FloatHolderBubbles holders={research.holders} />
        </section>
        <section className="min-w-0">
          <div className="border-b border-rule bg-panel-hi px-4 py-3 sm:px-6"><h2 className="text-xs font-bold uppercase tracking-wider text-amber">Pemegang saham ≥1% · {OWNERSHIP_AS_OF}</h2></div>
          {holders.length ? <div className="overflow-x-auto"><table className="w-full min-w-[42rem] text-left text-xs"><thead className="text-micro uppercase text-dim"><tr className="border-b border-rule"><th className="px-4 py-2">Pemegang</th><th className="px-2 py-2">Jenis</th><th className="px-2 py-2">Perlakuan model</th><th className="px-2 py-2 text-right">Saham</th><th className="px-4 py-2 text-right">Porsi</th></tr></thead><tbody>{research.holders.map((holder) => <tr key={`${holder.name}-${holder.shares}`} className="border-b border-rule/70"><td className="max-w-72 break-words px-4 py-2 text-ink-hi">{holder.name}{holder.affiliation && <a href={holder.affiliation.sourceUrl} target="_blank" rel="noopener noreferrer" className="block text-micro text-cyan hover:underline">Bukti afiliasi ↗</a>}</td><td className="px-2 py-2 text-ink">{holder.investorType || "N/D"}</td><td className="px-2 py-2 text-dim">{holder.treatment === "verified-affiliate" ? "Afiliasi terverifikasi" : holder.treatment === "type-strategic" ? "Strategis berdasar jenis" : "Afiliasi belum terverifikasi"}</td><td className="px-2 py-2 text-right tabular-nums text-ink">{count(holder.shares)}</td><td className="px-4 py-2 text-right tabular-nums text-amber">{pct(holder.percentage)}</td></tr>)}</tbody></table></div> : <p className="px-4 py-5 text-xs text-dim sm:px-6">Tidak ada rincian pemegang ≥1% untuk ticker ini pada snapshot yang tersedia.</p>}
        </section>
      </div>

      <aside className="min-w-0 border-b border-rule">
        <section className="border-b border-rule p-4 sm:p-6"><h2 className="text-xs font-bold uppercase tracking-wider text-amber">Perhitungan</h2>
          <p className="mt-3 text-micro uppercase tracking-wider text-dim">Vendor · TradingView</p><strong className="mt-1 block font-display text-xl text-ink-hi">{stock ? pct(stock.floatPercent) : "N/D"}</strong>
          <p className="mt-1 text-xs leading-relaxed text-ink">{stock ? `${count(stock.floatShares)} saham float ÷ ${count(stock.outstandingShares)} saham beredar × 100` : "Pasangan data saham float dan saham beredar belum tersedia."}</p>
          <p className="mt-2 text-micro text-dim">Dicek {jakarta(snapshot.fetchedAt)}. Data vendor dapat berbeda dari free float resmi BEI.</p>
          <div className="mt-4 border-t border-rule pt-4"><p className="text-micro uppercase tracking-wider text-dim">Model pemegang saham · BEI/KSEI</p><strong className="mt-1 block font-display text-xl text-cyan">{pct(research.indicativeFloatPercent)}</strong>
            <p className="mt-1 text-xs leading-relaxed text-ink">{research.indicativeFloatPercent === null ? "Tidak cukup data konsisten untuk menghitung." : `100% − ${pct(research.strategicPercent)} posisi strategis teridentifikasi. Termasuk ${pct(research.undisclosedPercent)} saham di luar daftar pemegang ≥1% yang diasumsikan beredar.`}</p>
            <p className="mt-2 text-micro leading-relaxed text-dim">Estimasi indikatif dari snapshot {OWNERSHIP_AS_OF}, bukan angka resmi. Kategori Corporate, BUMN, Government, Sovereign Wealth Fund, dan Foundation dianggap strategis; individu hanya jika afiliasinya punya bukti. Jenis lain serta posisi yang tidak terungkap belum dapat diverifikasi dan dapat membuat estimasi terlalu tinggi.</p>
          </div>
          <div className="mt-4 border-t border-rule pt-4 text-xs text-ink"><p>Posisi terungkap: <strong>{pct(holders.length ? research.disclosedPercent : null)}</strong></p><p className="mt-1">Selisih saham beredar − float vendor: <strong>{nonFloatShares === null ? "N/D" : count(nonFloatShares)}</strong></p><p className="mt-1">Market cap vendor: <strong>{formatValue(stock?.marketCap)}</strong></p></div>
        </section>
        <section className="border-b border-rule p-4 sm:p-6"><h2 className="text-xs font-bold uppercase tracking-wider text-amber">Saham dengan nama pemegang sama</h2><p className="mt-2 text-micro leading-relaxed text-dim">Nama sama di dua emiten bukan bukti afiliasi atau pengendalian. Klik ticker untuk profil saham.</p>{related.length ? <div className="mt-3 flex flex-wrap gap-2">{related.map((item) => <span key={item.code} className="inline-flex items-center border border-rule-hi text-xs"><Link href={`/asset/${item.code}`} title={`Pemegang bersama: ${item.shared.join(", ")}`} className="px-2 py-1.5 text-cyan hover:bg-cyan/10">{item.code}</Link><Link href={`/free-float/asset/${item.code}`} aria-label={`Rincian free float ${item.code}`} className="border-l border-rule-hi px-2 py-1.5 text-amber hover:bg-amber/10">Float</Link></span>)}</div> : <p className="mt-3 text-xs text-dim">Tidak ada koneksi nama dalam snapshot.</p>}</section>
        <section className="p-4 text-xs sm:p-6"><h2 className="font-bold uppercase tracking-wider text-amber">Sumber & batas data</h2><div className="mt-3 flex flex-col items-start gap-2"><a href={OWNERSHIP_SOURCE} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">BEI / KSEI · daftar kepemilikan ↗</a><a href={OWNERSHIP_TRANSCRIPTION} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Transkripsi data pemegang ↗</a><a href="https://www.tradingview.com/support/solutions/43000670341-free-float/" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">TradingView · metodologi float ↗</a><a href={`https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/${code}`} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Profil emiten BEI ↗</a></div><p className="mt-3 text-micro leading-relaxed text-dim">Snapshot kepemilikan dan data vendor punya waktu berbeda. Jangan menyamakan selisih kedua angka dengan transaksi atau perubahan kepemilikan terbaru.</p></section>
      </aside>
    </div>
  </main>;
}
