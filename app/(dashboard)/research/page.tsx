import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, Download, ExternalLink, FileText } from "lucide-react";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { MERIDIAN_ISSUES, researchDownloadUrl, researchFileUrl, researchTickerName, researchTickerUrl, type ResearchCategory } from "@/lib/research/meridian";

export const metadata: Metadata = { title: "Research — IDX Terminal" };

const CATEGORIES: ResearchCategory[] = ["Saham", "Makro & Kebijakan", "Komoditas", "Global"];

function showDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00Z`));
}

export default function ResearchPage() {
  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-6 sm:px-6">
      <p className="text-micro font-semibold uppercase tracking-[0.16em] text-amber">Riset pasar / arsip dokumen</p>
      <h1 className="mt-2 flex items-center gap-3 font-display text-2xl font-bold text-ink-hi"><BookOpenText className="h-6 w-6 text-amber" aria-hidden="true" />Research</h1>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-dim">Arsip Meridian Research. Ringkasan disusun dari isi PDF; pergerakan saham dihitung sejak sesi pertama setelah tanggal terbit laporan. Bila tanggal terbit tidak tercantum, tanggal unggah Drive dipakai sebagai titik pembanding dan diberi label.</p>
      <a href="https://drive.google.com/drive/folders/1FCMYl2YDvGl2BWI6RseCM1DokJZcFC0d" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs text-cyan hover:underline">Folder sumber Meridian Research <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>
    </header>
    <nav aria-label="Kategori riset" className="flex gap-2 overflow-x-auto border-b border-rule px-4 py-3 sm:px-6">
      {CATEGORIES.map((category) => <a key={category} href={`#${category.toLowerCase().replace(/[^a-z]+/g, "-")}`} className="shrink-0 border border-rule-hi px-3 py-2 text-xs font-semibold text-ink hover:border-amber hover:text-amber">{category} <span className="text-dim">{MERIDIAN_ISSUES.filter((issue) => issue.category === category).length}</span></a>)}
    </nav>
    <div className="space-y-1 bg-rule">
      {CATEGORIES.map((category) => <section key={category} id={category.toLowerCase().replace(/[^a-z]+/g, "-")} className="min-w-0 bg-panel">
        <h2 className="border-b border-rule bg-panel-hi px-4 py-3 font-display text-sm font-bold text-amber sm:px-6">{category}</h2>
        <div className="grid gap-px bg-rule lg:grid-cols-2">
          {MERIDIAN_ISSUES.filter((issue) => issue.category === category).map((issue) => <article key={issue.number} className="flex min-w-0 flex-col bg-panel p-4 sm:p-5">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-micro font-bold uppercase tracking-wider text-amber">Meridian #{String(issue.number).padStart(2, "0")}</p><h3 className="mt-1 break-words font-display text-base font-bold text-ink-hi">{issue.title}</h3></div>
              <FileText className="h-5 w-5 shrink-0 text-dim" aria-hidden="true" />
            </div>
            <p className="mt-2 text-micro text-dim">{issue.publishedAt ? `Terbit ${showDate(issue.publishedAt)} · dari PDF` : `Diunggah ${showDate(issue.uploadedAt)} · tanggal terbit belum terverifikasi`}</p>
            <p className="mt-3 flex-1 text-xs leading-5 text-ink">{issue.summary ? issue.summary[0] : "PDF berbasis gambar; ringkasan isi dan saham yang disebut belum dapat diverifikasi. Buka dokumen asli untuk membacanya."}</p>
            {issue.tickers.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Saham yang disebut dalam laporan">{issue.tickers.map((code) => <Link key={code} href={researchTickerUrl(code)} target={researchTickerUrl(code).startsWith("http") ? "_blank" : undefined} rel={researchTickerUrl(code).startsWith("http") ? "noopener noreferrer" : undefined} title={getCompanyCatalogEntry(code)?.name ?? researchTickerName(code) ?? code} className="border border-cyan/40 px-2 py-1 text-micro font-bold text-cyan hover:border-cyan hover:bg-cyan/10">{code}</Link>)}</div>}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule pt-3">
              <Link href={`/research/${issue.number}`} className="inline-flex min-h-10 items-center gap-1.5 border border-amber bg-amber px-3 text-xs font-bold text-void hover:brightness-110"><BookOpenText className="h-4 w-4" aria-hidden="true" />Baca & ringkasan <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
              <a href={researchDownloadUrl(issue)} target="_blank" rel="noopener noreferrer" aria-label={`Unduh PDF ${issue.title}`} className="inline-flex min-h-10 items-center gap-1.5 border border-rule-hi px-3 text-xs font-semibold text-ink hover:border-cyan hover:text-cyan"><Download className="h-4 w-4" aria-hidden="true" />Unduh</a>
              <a href={researchFileUrl(issue)} target="_blank" rel="noopener noreferrer" aria-label={`Buka PDF asli ${issue.title}`} className="inline-flex min-h-10 items-center gap-1.5 px-2 text-xs text-cyan hover:underline"><ExternalLink className="h-4 w-4" aria-hidden="true" />PDF asli</a>
            </div>
          </article>)}
        </div>
      </section>)}
    </div>
  </main>;
}
