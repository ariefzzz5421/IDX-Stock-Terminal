import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { IndexProviderLogo } from "./IndexProviderLogo";
import { INDEX_RESEARCH, formatResearchDate } from "@/lib/index-research";

export function IndexResearchTable() {
  return <section className="border-t border-rule bg-panel" aria-labelledby="index-research-title">
    <header className="border-b border-rule bg-panel-hi px-4 py-4 sm:px-6">
      <h2 id="index-research-title" className="font-display text-sm font-bold text-ink-hi">Riset & dokumen resmi</h2>
      <p className="mt-1 text-micro text-dim">Arsip pilihan sejak 2020 · urut tanggal penerbitan terbaru</p>
    </header>
    <div className="divide-y divide-rule">
      {INDEX_RESEARCH.map((paper) => <article key={paper.slug} className="grid min-w-0 gap-3 px-4 py-3 sm:grid-cols-[4.25rem_minmax(0,1fr)_auto] sm:items-center sm:px-6">
        <IndexProviderLogo provider={paper.provider} />
        <div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-cyan">{paper.provider} · {paper.kind} · <time dateTime={paper.publishedAt}>{formatResearchDate(paper.publishedAt)}</time></p><h3 className="mt-1 text-xs font-bold text-ink-hi">{paper.title}</h3></div>
        <div className="flex flex-wrap gap-2"><Link href={`/foreign-flow/research/${paper.slug}`} className="inline-flex min-h-10 items-center gap-1 border border-amber px-3 py-2 text-xs font-bold text-amber hover:bg-amber hover:text-void">Enter <ArrowRight className="h-3.5 w-3.5" /></Link><a href={paper.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 border border-rule-hi px-3 py-2 text-xs text-cyan hover:border-cyan">Sumber <ExternalLink className="h-3.5 w-3.5" /></a></div>
      </article>)}
    </div>
  </section>;
}
