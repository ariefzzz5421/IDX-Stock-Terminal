import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, FolderOpen } from "lucide-react";
import { MERIDIAN_ISSUES } from "@/lib/research/meridian";

export const metadata: Metadata = { title: "Research — IDX Terminal" };

export default function ResearchPage() {
  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-6 sm:px-6">
      <p className="text-micro font-semibold uppercase tracking-[0.16em] text-amber">Riset pasar / arsip dokumen</p>
      <h1 className="mt-2 flex items-center gap-3 font-display text-2xl font-bold text-ink-hi"><BookOpenText className="h-6 w-6 text-amber" aria-hidden="true" />Research</h1>
    </header>
    <div className="grid gap-3 p-4 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
      <Link href="/research/meridian" className="group flex min-h-36 min-w-0 flex-col justify-between border border-rule-hi bg-panel-hi p-4 transition-colors hover:border-amber hover:bg-amber/5 focus-visible:outline-2 focus-visible:outline-amber sm:p-5">
        <div className="flex items-start gap-3"><FolderOpen className="h-6 w-6 shrink-0 text-amber" aria-hidden="true" /><div className="min-w-0"><h2 className="font-display text-base font-bold text-ink-hi">Meridian Research</h2><p className="mt-1 text-xs text-dim">{MERIDIAN_ISSUES.length} laporan PDF</p></div></div>
        <span className="inline-flex items-center gap-2 self-end text-xs font-bold text-cyan group-hover:text-amber">Buka folder <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
      </Link>
    </div>
  </main>;
}
