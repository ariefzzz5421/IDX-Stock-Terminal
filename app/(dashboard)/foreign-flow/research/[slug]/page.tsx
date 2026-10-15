import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { IndexProviderLogo } from "@/components/terminal/IndexProviderLogo";
import { INDEX_RESEARCH, formatResearchDate } from "@/lib/index-research";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const paper = INDEX_RESEARCH.find((item) => item.slug === slug);
  return { title: paper ? `${paper.title} — IDX Terminal` : "Riset tidak ditemukan — IDX Terminal" };
}

export default async function IndexResearchPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const { slug } = await params;
  const paper = INDEX_RESEARCH.find((item) => item.slug === slug);
  if (!paper) notFound();

  return <main className="min-w-0 flex-1 bg-void px-4 py-6 sm:px-6">
    <Link href="/foreign-flow#index-research-title" className="inline-flex min-h-10 items-center gap-2 text-xs text-cyan hover:underline"><ArrowLeft className="h-4 w-4" /> Foreign Flow</Link>
    <article className="mt-4 max-w-4xl border border-rule bg-panel">
      <header className="border-b border-rule bg-panel-hi p-4 sm:p-6">
        <div className="flex items-center gap-3"><IndexProviderLogo provider={paper.provider} /><p className="text-xs text-cyan">{paper.provider} · {paper.kind} · <time dateTime={paper.publishedAt}>{formatResearchDate(paper.publishedAt)}</time></p></div>
        <h1 className="mt-4 font-display text-xl font-bold text-ink-hi sm:text-2xl">{paper.title}</h1>
      </header>
      <div className="space-y-5 p-4 text-sm leading-7 text-ink sm:p-6">
        <section><h2 className="text-xs font-bold uppercase tracking-wider text-amber">Ringkasan</h2><p className="mt-2">{paper.summary}</p></section>
        <section><h2 className="text-xs font-bold uppercase tracking-wider text-amber">Isi utama</h2><ul className="mt-2 list-disc space-y-2 pl-5">{paper.findings.map((finding) => <li key={finding}>{finding}</li>)}</ul></section>
        <section><h2 className="text-xs font-bold uppercase tracking-wider text-amber">Kaitan dengan data situs</h2><p className="mt-2">{paper.relevance}</p></section>
        <div className="border-t border-rule pt-4"><div className="flex flex-wrap gap-2"><a href={paper.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 border border-cyan px-4 py-2 text-xs font-bold text-cyan hover:bg-cyan/10">Baca dokumen resmi lengkap <ExternalLink className="h-4 w-4" /></a>{paper.relatedSourceUrl && <a href={paper.relatedSourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 border border-rule-hi px-4 py-2 text-xs font-bold text-cyan hover:border-cyan">Factsheet FTSE Emerging <ExternalLink className="h-4 w-4" /></a>}</div><p className="mt-2 text-xs text-dim">Ringkasan di halaman ini disusun dari dokumen penerbit; gunakan tautan resmi untuk seluruh isi dan lampiran.</p></div>
      </div>
    </article>
  </main>;
}
