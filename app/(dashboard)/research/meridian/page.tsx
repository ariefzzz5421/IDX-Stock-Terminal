import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText, Download, ExternalLink, FileText } from "lucide-react";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { MERIDIAN_ISSUES, researchDownloadUrl, researchFileUrl, researchTickerName, researchTickerUrl } from "@/lib/research/meridian";

export const metadata: Metadata = { title: "Meridian Research — IDX Terminal" };

const issues = [...MERIDIAN_ISSUES].sort((left, right) => {
  const dateOrder = (right.publishedAt ?? right.uploadedAt).localeCompare(left.publishedAt ?? left.uploadedAt);
  return dateOrder || right.number - left.number;
});

function showDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00Z`));
}

export default function MeridianResearchPage() {
  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <Link href="/research" className="inline-flex min-h-9 items-center gap-1.5 text-xs text-cyan hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Semua folder</Link>
      <h1 className="mt-2 flex items-center gap-3 font-display text-2xl font-bold text-ink-hi"><BookOpenText className="h-6 w-6 text-amber" aria-hidden="true" />Meridian Research</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-dim"><span>{issues.length} laporan · terbaru di atas</span><a href="https://drive.google.com/drive/folders/1FCMYl2YDvGl2BWI6RseCM1DokJZcFC0d" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan hover:underline">Folder sumber <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a></div>
    </header>
    <div className="divide-y divide-rule">
      {issues.map((issue) => <article key={issue.number} className="min-w-0 p-4 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-start gap-3"><FileText className="mt-0.5 h-5 w-5 shrink-0 text-amber" aria-hidden="true" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro font-bold uppercase tracking-wider text-amber"><span>Meridian #{String(issue.number).padStart(2, "0")}</span><span className="text-dim">{issue.category}</span></div><h2 className="mt-1 break-words font-display text-base font-bold text-ink-hi">{issue.title}</h2><p className="mt-1 text-micro text-dim">{issue.publishedAt ? `Terbit ${showDate(issue.publishedAt)} · dari PDF` : `Diunggah ${showDate(issue.uploadedAt)} · tanggal terbit belum terverifikasi`}</p>{issue.summary && <p className="mt-3 max-w-4xl text-xs leading-5 text-ink">{issue.summary[0]}</p>}{issue.tickers.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Saham yang disebut dalam laporan">{issue.tickers.map((code) => <Link key={code} href={researchTickerUrl(code)} target={researchTickerUrl(code).startsWith("http") ? "_blank" : undefined} rel={researchTickerUrl(code).startsWith("http") ? "noopener noreferrer" : undefined} title={getCompanyCatalogEntry(code)?.name ?? researchTickerName(code) ?? code} className="border border-cyan/40 px-2 py-1 text-micro font-bold text-cyan hover:border-cyan hover:bg-cyan/10">{code}</Link>)}</div>}
          <div className="mt-4 flex flex-wrap items-center gap-2"><Link href={`/research/${issue.number}`} className="inline-flex min-h-10 items-center gap-1.5 border border-amber bg-amber px-3 text-xs font-bold text-void hover:brightness-110"><BookOpenText className="h-4 w-4" aria-hidden="true" />Baca & ringkasan <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link><a href={researchDownloadUrl(issue)} target="_blank" rel="noopener noreferrer" aria-label={`Unduh PDF ${issue.title}`} className="inline-flex min-h-10 items-center gap-1.5 border border-rule-hi px-3 text-xs font-semibold text-ink hover:border-cyan hover:text-cyan"><Download className="h-4 w-4" aria-hidden="true" />Unduh</a><a href={researchFileUrl(issue)} target="_blank" rel="noopener noreferrer" aria-label={`Buka PDF asli ${issue.title}`} className="inline-flex min-h-10 items-center gap-1.5 px-2 text-xs text-cyan hover:underline"><ExternalLink className="h-4 w-4" aria-hidden="true" />PDF asli</a></div>
        </div></div>
      </article>)}
    </div>
  </main>;
}
