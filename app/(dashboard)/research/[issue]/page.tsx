import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpenText, Download, ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { formatPrice } from "@/lib/format";
import { MERIDIAN_ISSUES, researchDownloadUrl, researchFileUrl, researchIssue, researchPreviewUrl, researchTickerName, researchTickerUrl } from "@/lib/research/meridian";
import { researchPriceMovements } from "@/lib/research/price-movement";

export function generateStaticParams() { return MERIDIAN_ISSUES.map((issue) => ({ issue: String(issue.number) })); }

export async function generateMetadata({ params }: PageProps<"/research/[issue]">): Promise<Metadata> {
  const issue = researchIssue(Number((await params).issue));
  return { title: issue ? `${issue.title} — Research — IDX Terminal` : "Research — IDX Terminal" };
}

function showDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00Z`));
}

export default async function ResearchIssuePage({ params }: PageProps<"/research/[issue]">) {
  const issue = researchIssue(Number((await params).issue));
  if (!issue) notFound();
  const movements = await researchPriceMovements(issue.tickers, issue.publishedAt ?? issue.uploadedAt);
  const byCode = new Map(movements.map((movement) => [movement.code, movement]));

  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <Link href="/research/meridian" className="inline-flex min-h-9 items-center gap-1.5 text-xs text-cyan hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Meridian Research</Link>
      <p className="mt-3 text-micro font-semibold uppercase tracking-[0.16em] text-amber">Meridian Research / #{String(issue.number).padStart(2, "0")} / {issue.category}</p>
      <h1 className="mt-1 break-words font-display text-2xl font-bold text-ink-hi">{issue.title}</h1>
      <p className="mt-2 text-xs text-dim">{issue.publishedAt ? `Tanggal terbit dalam PDF: ${showDate(issue.publishedAt)}` : `Tanggal unggah Drive: ${showDate(issue.uploadedAt)} · tanggal terbit dalam PDF belum terverifikasi; grafik memakai tanggal unggah`}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={researchDownloadUrl(issue)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 border border-amber bg-amber px-3 text-xs font-bold text-void hover:brightness-110"><Download className="h-4 w-4" aria-hidden="true" />Unduh PDF</a>
        <a href={researchFileUrl(issue)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 border border-rule-hi px-3 text-xs font-semibold text-cyan hover:border-cyan"><ExternalLink className="h-4 w-4" aria-hidden="true" />Buka di Drive</a>
      </div>
    </header>
    <div className="grid min-w-0 gap-px bg-rule xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
      <div className="min-w-0 space-y-px bg-rule">
        <section className="bg-panel p-4 sm:p-6"><h2 className="flex items-center gap-2 font-display text-sm font-bold text-amber"><BookOpenText className="h-4 w-4" aria-hidden="true" />Ringkasan isi PDF</h2>
          {issue.summary ? <ul className="mt-4 space-y-3 text-sm leading-6 text-ink">{issue.summary.map((item) => <li key={item} className="border-l-2 border-amber/50 pl-3">{item}</li>)}</ul> : <p className="mt-4 text-sm leading-6 text-dim">PDF ini berupa gambar. Isi, tanggal terbit, dan ticker belum bisa dipastikan dari teks yang tersedia, sehingga ringkasan otomatis tidak ditampilkan.</p>}
          <p className="mt-4 text-micro leading-5 text-dim">Ringkasan editorial berbantuan AI dari dokumen sumber. Ini merangkum pandangan penulis pada tanggal laporan, bukan rekomendasi investasi terbaru.</p>
        </section>
        <section className="bg-panel p-4 sm:p-6"><h2 className="font-display text-sm font-bold text-amber">Saham yang disebut · sejak {issue.publishedAt ? "laporan" : "unggah Drive"}</h2>
          {issue.tickers.length ? <div className="mt-3 space-y-2">{issue.tickers.map((code) => {
            const movement = byCode.get(code);
            return <Link key={code} href={researchTickerUrl(code)} target={researchTickerUrl(code).startsWith("http") ? "_blank" : undefined} rel={researchTickerUrl(code).startsWith("http") ? "noopener noreferrer" : undefined} className="flex min-w-0 flex-wrap items-center justify-between gap-2 border border-rule-hi p-3 hover:border-amber hover:bg-panel-hi">
              <span className="min-w-0"><strong className="font-display text-sm text-ink-hi">{code}</strong><span className="ml-2 text-xs text-dim">{getCompanyCatalogEntry(code)?.name ?? researchTickerName(code)}</span></span>
              <span className="flex shrink-0 items-center gap-2">{movement ? <span className={`text-sm font-bold ${movement.changePct >= 0 ? "text-up" : "text-down"}`}>{movement.changePct >= 0 ? <TrendingUp className="mr-1 inline h-4 w-4" aria-hidden="true" /> : <TrendingDown className="mr-1 inline h-4 w-4" aria-hidden="true" />}{movement.changePct >= 0 ? "+" : ""}{movement.changePct.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%</span> : <span className="text-xs text-dim">Harga belum tersedia</span>}<ArrowUpRight className="h-4 w-4 text-cyan" aria-hidden="true" /></span>
              {movement && <span className="w-full text-micro text-dim">{showDate(movement.baselineDate)}: {movement.currency === "IDR" ? `Rp${formatPrice(movement.baselinePrice)}` : `US$${movement.baselinePrice.toFixed(2)}`} → {showDate(movement.latestDate)}: {movement.currency === "IDR" ? `Rp${formatPrice(movement.latestPrice)}` : `US$${movement.latestPrice.toFixed(2)}`} · penutupan Yahoo Finance tertunda</span>}
            </Link>;
          })}</div> : <p className="mt-3 text-xs text-dim">Belum ada ticker yang terverifikasi dari isi laporan ini.</p>}
          {issue.tickers.length > 0 && <p className="mt-3 text-micro leading-5 text-dim">Tanggal dasar ialah sesi bursa pertama pada atau setelah {issue.publishedAt ? "laporan terbit" : "PDF diunggah ke Drive"}. Perubahan harga bukan hasil investasi atau imbal hasil riil; dividen dan biaya transaksi tidak dihitung.</p>}
        </section>
      </div>
      <section className="min-w-0 bg-panel p-3 sm:p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-sm font-bold text-amber">Baca PDF</h2><a href={researchFileUrl(issue)} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan hover:underline">Jika pratinjau tidak tampil, buka di Drive ↗</a></div><iframe src={researchPreviewUrl(issue)} title={`PDF Meridian Research ${issue.title}`} loading="lazy" className="h-[min(75dvh,54rem)] min-h-[30rem] w-full border border-rule-hi bg-panel-hi" referrerPolicy="no-referrer" /></section>
    </div>
  </main>;
}
