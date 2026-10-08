import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Newspaper } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getKongloFeed } from "@/lib/konglo-feed";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";
import { KongloPortrait } from "@/components/konglo/KongloPortrait";
import { KongloFeedFilters } from "@/components/konglo/KongloFeedFilters";

export const metadata: Metadata = { title: "Konglo Feed — IDX Terminal" };
export const dynamic = "force-dynamic";

function date(value: Date | null | undefined) {
  return value ? new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }).format(value) + " WIB" : "Tanggal belum tersedia";
}

export default async function KongloFeedPage({ searchParams }: { searchParams: Promise<{ person?: string; page?: string; q?: string }> }) {
  await requireUser();
  const { person, page, q } = await searchParams;
  const feed = await getKongloFeed(person, Number(page ?? 1), q);
  const pageHref = (target: number) => `/konglo/feed?${new URLSearchParams({ ...(feed.selected ? { person: feed.selected.slug } : {}), ...(feed.search ? { q: feed.search } : {}), page: String(target) })}`;
  const items = [
    ...feed.events.map((event) => ({ kind: "research" as const, at: event.lastChangedAt, event })),
    ...(feed.page === 1 ? feed.pending.map((item) => ({ kind: "pending" as const, at: new Date(item.announcedOn), item })) : []),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <Link href="/konglo" className="inline-flex items-center gap-1 text-micro text-cyan hover:underline"><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />Konglo</Link>
      <h1 className="mt-3 flex items-center gap-2 font-display text-xl font-bold text-ink-hi"><Newspaper aria-hidden="true" className="h-5 w-5 text-amber" />Konglo Feed</h1>
    </header>
    <KongloFeedFilters profiles={feed.profiles.map(({ slug, name }) => ({ slug, name }))} selected={feed.selected?.slug} query={feed.search} />
    <div className="mx-auto max-w-3xl border-x border-rule">
      <div className="flex items-center justify-between gap-3 border-b border-rule bg-panel-hi px-4 py-3 text-micro sm:px-5"><h2 className="font-bold uppercase tracking-widest text-amber">Feed · {feed.total + feed.pending.length} pembaruan</h2><Link href="/ai-analyst" className="text-cyan hover:underline">Riset AI <ArrowRight aria-hidden="true" className="inline h-3 w-3" /></Link></div>
      {items.length ? <div className="divide-y divide-rule">{items.map((entry) => entry.kind === "research" ? (() => {
        const event = entry.event;
        const source = event.versions[0];
        return <article key={event.id} className="min-w-0 px-4 py-5 sm:px-5">
          <div className="flex items-start gap-3"><KongloPortrait slug={event.related[0]?.slug ?? ""} name={event.related[0]?.name ?? "Konglo"} size={38} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"><strong className="text-ink-hi">{event.related.map((profile) => profile.name).join(", ")}</strong><span className="text-dim">· {date(source?.announcementAt ?? event.publishedAt)}</span></div><p className="mt-1 text-micro text-dim">Riset diterbitkan {date(event.lastChangedAt)} · {event.status === "CONFIRMED" ? "Terverifikasi" : "Informasi awal"}</p></div></div>
          <div className="mt-3 flex flex-wrap gap-2 text-micro"><span className="border border-amber-dim px-1.5 py-0.5 font-bold text-amber">{event.category.replaceAll("_", " ")}</span><span className="border border-rule-hi px-1.5 py-0.5 text-ink">{event.priority}</span></div>
          <h3 className="mt-3 text-sm font-bold leading-5 text-ink-hi">{event.title}</h3><p className="mt-2 text-xs leading-5 text-ink">{event.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">{event.tickers.map((ticker) => <Link key={ticker.stockCode} href={`/asset/${ticker.stockCode}`} className="inline-flex items-center gap-1.5 border border-rule-hi px-1.5 py-1 text-xs font-bold text-cyan hover:border-cyan"><CompanyLogo code={ticker.stockCode} size="sm" />{ticker.stockCode}</Link>)}</div>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-rule pt-3 text-xs"><Link href={`/ai-analyst/research/${event.id}`} className="font-bold text-amber hover:underline">Baca riset <ArrowRight aria-hidden="true" className="inline h-3.5 w-3.5" /></Link>{source?.sourceUrl && <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Sumber asli <ExternalLink aria-hidden="true" className="inline h-3 w-3" /></a>}</div>
        </article>;
      })() : <article key={`${entry.item.slug}-${entry.item.code}`} className="min-w-0 px-4 py-5 sm:px-5"><div className="flex items-start gap-3"><KongloPortrait slug={entry.item.slug} name={entry.item.name} size={38} /><div className="min-w-0"><Link href={`/konglo/${entry.item.slug}`} className="text-xs font-bold text-ink-hi hover:text-amber">{entry.item.name}</Link><p className="text-micro text-dim">Diumumkan {entry.item.announcedOn}</p></div></div><span className="mt-3 inline-block border border-amber-dim px-1.5 py-0.5 text-micro text-amber">RENCANA BERSYARAT · BELUM DIKONFIRMASI SELESAI</span><p className="mt-3 text-xs leading-5 text-ink">{entry.item.holder} merencanakan transaksi {entry.item.percentage.toLocaleString("id-ID")}% saham <Link href={`/asset/${entry.item.code}`} className="font-bold text-cyan hover:underline">${entry.item.code}</Link>. {entry.item.note}</p><a href={entry.item.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-cyan hover:underline">Baca sumber awal ↗</a></article>)}</div> : <p className="px-4 py-8 text-xs leading-5 text-ink sm:px-5">Belum ada pembaruan yang cocok. Data yang belum diverifikasi tidak ditampilkan sebagai peristiwa terkonfirmasi. <Link href="/ai-analyst" className="text-cyan hover:underline">Lihat status pemindaian</Link>.</p>}
      {feed.total > feed.pageSize && <nav aria-label="Halaman Konglo Feed" className="flex items-center gap-4 border-t border-rule px-4 py-3 text-xs sm:px-5">{feed.page > 1 && <Link href={pageHref(feed.page - 1)} className="text-cyan hover:underline">← Lebih baru</Link>}<span className="text-ink">Halaman {feed.page}</span>{feed.page * feed.pageSize < feed.total && <Link href={pageHref(feed.page + 1)} className="text-cyan hover:underline">Lebih lama →</Link>}</nav>}
    </div>
  </main>;
}
