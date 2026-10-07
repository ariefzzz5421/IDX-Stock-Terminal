import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Riset korporasi — IDX Terminal" };
function date(value: Date | null | undefined) { return value ? new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" }).format(value) + " WIB" : "N/D"; }

export default async function ResearchDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const event = await prisma.intelligenceEvent.findUnique({
    where: { id }, include: { versions: { orderBy: { eventVersion: "desc" } }, sources: { orderBy: { fetchedAt: "desc" } }, tickers: true },
  });
  if (!event) notFound();
  const current = event.versions[0];
  const facts = current ? JSON.parse(current.factsJson) as {
    evidence: Array<{ claim: string; exactQuote: string }>; transactionIdr: number | null; newShares: number | null;
    existingShares: number | null; exercisePriceIdr: number | null; dilutionPct: number | null;
  } : null;
  const analysis = current ? JSON.parse(current.analysisJson) as Record<string, string | string[]> : null;
  const rupiah = (v: number | null | undefined) => v == null ? "N/D" : `Rp${new Intl.NumberFormat("id-ID").format(v)}`;
  return <main className="min-w-0 flex-1 bg-panel text-ink">
    <header className="border-b border-rule p-4 sm:p-6">
      <Link href="/ai-analyst" className="text-xs text-cyan hover:underline">← Semua riset</Link>
      <p className="mt-4 text-micro font-bold uppercase tracking-widest text-amber">{event.category.replaceAll("_", " ")} · {event.priority} · {event.status}</p>
      <h1 className="mt-2 max-w-4xl font-display text-2xl font-bold text-ink-hi">{event.title}</h1>
      <p className="mt-2 text-xs text-dim">Dipublikasikan {date(current?.publishedAt)} · Berlaku {date(current?.effectiveAt)} · Versi {event.latestVersion}</p>
      <div className="mt-3 flex flex-wrap gap-2">{event.tickers.map((ticker) => <Link key={ticker.securityCode} href={`/asset/${ticker.stockCode}`} className="inline-flex min-w-0 items-center gap-2 border border-cyan/50 px-2 py-1 text-xs font-bold text-cyan"><CompanyLogo code={ticker.stockCode} />{ticker.securityCode} ↗</Link>)}</div>
    </header>
    <div className="grid gap-px bg-rule xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
      <div className="space-y-px">
        <Block title="Ringkasan eksekutif"><p>{event.summary}</p><p className="mt-3 text-xs text-amber">Arah dampak: {event.direction}. Label arah tidak menjamin harga bergerak sesuai perkiraan.</p></Block>
        <Block title="Fakta dari dokumen asli">{facts?.evidence?.length ? <ul className="space-y-4">{facts.evidence.map((e, i) => <li key={i}><strong className="text-ink-hi">{e.claim}</strong><blockquote className="mt-1 border-l-2 border-cyan pl-3 text-xs text-dim">“{e.exactQuote}”</blockquote></li>)}</ul> : <p>Belum tersedia.</p>}</Block>
        <Block title="Implikasi finansial">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Stat name="Nilai transaksi" value={rupiah(facts?.transactionIdr)} />
            <Stat name="Harga pelaksanaan" value={rupiah(facts?.exercisePriceIdr)} />
            <Stat name="Saham baru" value={facts?.newShares == null ? "N/D" : new Intl.NumberFormat("id-ID").format(facts.newShares)} />
            <Stat name="Potensi dilusi sederhana" value={facts?.dilutionPct == null ? "N/D" : `${facts.dilutionPct.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`} />
          </dl>
          {analysis && <div className="mt-5 space-y-3">{[
            ["Perubahan dari pengumuman sebelumnya", "whatChanged"], ["Materialitas", "materiality"], ["Dampak ke emiten", "issuerImpact"],
            ["Perkiraan dampak pasar", "marketImpact"], ["Ketidakpastian", "uncertainty"], ["Dilusi", "dilution"],
            ["Likuiditas", "liquidity"], ["Utang", "debt"], ["Kepemilikan", "ownership"],
          ].map(([label, key]) => <p key={key}><strong className="text-amber">{label}:</strong> {analysis[key] || "N/D"}</p>)}</div>}
        </Block>
        <Block title="Yang perlu dipantau"><p>{analysis?.monitorNext || "N/D"}</p></Block>
      </div>
      <aside className="space-y-px">
        <Block title="Tanggal penting"><Stat name="Pengumuman" value={date(current?.announcementAt)} /><Stat name="Berlaku" value={date(current?.effectiveAt)} /><Stat name="Pertama terlihat" value={date(event.firstSeenAt)} /><Stat name="Terakhir diperiksa" value={date(event.lastCheckedAt)} /></Block>
        <Block title="Sumber asli">{event.sources.map((s) => <div key={s.id} className="mb-3"><a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="break-all text-xs text-cyan hover:underline">{s.title || s.sourceUrl} ↗</a><p className="text-micro text-dim">{s.adapter} · {s.status} · {date(s.publishedAt)}</p></div>)}</Block>
        <Block title="Riwayat perubahan">{event.versions.map((v) => <div key={v.id} className="border-b border-rule py-2 last:border-0"><p className="text-xs font-bold text-ink-hi">Versi {v.eventVersion} · {v.changeType}</p><p className="text-micro text-dim">{date(v.publishedAt)} · {v.status}</p>{v.previousVersionId && <p className="text-micro text-dim">Mengganti versi sebelumnya</p>}</div>)}</Block>
      </aside>
    </div>
  </main>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) { return <section className="bg-panel p-4 text-sm leading-6 sm:p-6"><h2 className="mb-3 border-b border-rule pb-2 text-micro font-bold uppercase tracking-widest text-amber">{title}</h2>{children}</section>; }
function Stat({ name, value }: { name: string; value: string }) { return <div className="mb-2"><dt className="text-micro uppercase tracking-widest text-dim">{name}</dt><dd className="font-bold text-ink-hi">{value}</dd></div>; }
