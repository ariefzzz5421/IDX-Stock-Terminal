import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Newspaper } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getKongloFeed } from "@/lib/konglo-feed";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";

export const metadata: Metadata = { title: "Konglo Feed — IDX Terminal" };
export const dynamic = "force-dynamic";

function date(value: Date | null | undefined) {
  return value ? new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }).format(value) + " WIB" : "N/D";
}

export default async function KongloFeedPage({ searchParams }: { searchParams: Promise<{ person?: string; page?: string }> }) {
  await requireUser();
  const { person, page } = await searchParams;
  const feed = await getKongloFeed(person, Number(page ?? 1));
  const pageHref = (target: number) => `/konglo/feed?${new URLSearchParams({ ...(feed.selected ? { person: feed.selected.slug } : {}), page: String(target) })}`;

  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <Link href="/konglo" className="inline-flex items-center gap-1 text-micro text-cyan hover:underline"><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />Konglo</Link>
      <h1 className="mt-3 flex items-center gap-2 font-display text-xl font-bold text-ink-hi"><Newspaper aria-hidden="true" className="h-5 w-5 text-amber" />Konglo Feed</h1>
      <p className="mt-2 max-w-3xl text-xs leading-5 text-ink">Pembaruan akuisisi, kepemilikan, dan aksi korporasi dari riset bersumber yang melibatkan emiten dalam daftar Konglo. Hubungan emiten dengan seorang tokoh tidak membuktikan tokoh itu menjadi pihak transaksi.</p>
      <p className="mt-2 text-micro text-dim">Scan terakhir: {date(feed.latestRun?.endedAt ?? feed.latestRun?.startedAt)} · {feed.latestRun?.status ?? "belum ada"} · berhasil terakhir: {date(feed.latestSuccess?.endedAt)}{feed.latestRun?.failedAdapters ? ` · ${feed.latestRun.failedAdapters} sumber gagal` : ""}</p>
    </header>

    <nav aria-label="Filter tokoh Konglo" className="flex gap-2 overflow-x-auto border-b border-rule bg-panel-hi px-4 py-3 sm:px-6">
      <Link href="/konglo/feed" className={`shrink-0 border px-3 py-2 text-xs ${!feed.selected ? "border-amber text-amber" : "border-rule-hi text-ink hover:text-amber"}`}>Semua</Link>
      {feed.profiles.map((profile) => <Link key={profile.slug} href={`/konglo/feed?person=${encodeURIComponent(profile.slug)}`} className={`shrink-0 border px-3 py-2 text-xs ${feed.selected?.slug === profile.slug ? "border-amber text-amber" : "border-rule-hi text-ink hover:text-amber"}`}>{profile.name}</Link>)}
    </nav>

    <section aria-labelledby="konglo-feed-research" className="border-b border-rule">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-panel-hi px-4 py-3 sm:px-6"><h2 id="konglo-feed-research" className="text-micro font-bold uppercase tracking-widest text-amber">Riset bersumber · {feed.total} peristiwa</h2><Link href="/ai-analyst" className="text-micro text-cyan hover:underline">Semua riset <ArrowRight aria-hidden="true" className="inline h-3 w-3" /></Link></div>
      {feed.events.length ? <div className="grid gap-px bg-rule lg:grid-cols-2">{feed.events.map((event) => {
        const source = event.versions[0];
        return <article key={event.id} className="min-w-0 bg-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2 text-micro"><span className="border border-amber-dim px-1.5 py-0.5 font-bold text-amber">{event.category.replaceAll("_", " ")}</span><span className={event.status === "CONFIRMED" ? "text-up" : "text-amber"}>{event.status}</span><span className="text-dim">{event.priority} · versi {event.latestVersion}</span></div>
          <h3 className="mt-3 text-sm font-bold leading-5 text-ink-hi">{event.title}</h3>
          <p className="mt-2 text-xs leading-5 text-ink">{event.summary}</p>
          <p className="mt-2 text-micro text-dim">Pengumuman {date(source?.announcementAt)} · pembaruan riset {date(event.lastChangedAt)}{source?.changeType && source.changeType !== "NEW" ? ` · ${source.changeType.replaceAll("_", " ")}` : ""}</p>
          <div className="mt-3 flex flex-wrap gap-2">{event.tickers.map((ticker) => <Link key={ticker.stockCode} href={`/asset/${ticker.stockCode}`} className="inline-flex items-center gap-1.5 border border-rule-hi px-1.5 py-1 text-xs font-bold text-cyan hover:border-cyan"><CompanyLogo code={ticker.stockCode} size="sm" />{ticker.stockCode}</Link>)}</div>
          <div className="mt-3 flex flex-wrap gap-2 text-micro text-ink">Terkait daftar: {event.related.map((profile) => <Link key={profile.slug} href={`/konglo/${profile.slug}`} className="border border-rule-hi px-1.5 py-0.5 hover:text-amber">{profile.name} · {profile.kind === "direct" ? "langsung" : profile.kind === "pending" ? "rencana" : "grup"}</Link>)}</div>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-rule pt-3 text-xs"><Link href={`/ai-analyst/research/${event.id}`} className="font-bold text-amber hover:underline">Baca analisis <ArrowRight aria-hidden="true" className="inline h-3.5 w-3.5" /></Link>{source?.sourceUrl && <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Dokumen sumber <ExternalLink aria-hidden="true" className="inline h-3 w-3" /></a>}</div>
        </article>;
      })}</div> : <p className="px-4 py-8 text-xs leading-5 text-ink sm:px-6">Belum ada riset akuisisi atau afiliasi yang terverifikasi untuk emiten terkait. Ini tidak berarti tidak ada perkembangan: cakupan mengikuti sumber yang berhasil dipindai, dan sumber yang gagal tercatat di status scan.</p>}
      {feed.total > feed.pageSize && <nav aria-label="Halaman Konglo Feed" className="flex items-center gap-4 border-t border-rule px-4 py-3 text-xs sm:px-6">{feed.page > 1 && <Link href={pageHref(feed.page - 1)} className="text-cyan hover:underline">← Lebih baru</Link>}<span className="text-ink">Halaman {feed.page}</span>{feed.page * feed.pageSize < feed.total && <Link href={pageHref(feed.page + 1)} className="text-cyan hover:underline">Lebih lama →</Link>}</nav>}
    </section>

    {feed.pending.length > 0 && <section aria-labelledby="pending-konglo" className="px-4 py-5 sm:px-6"><h2 id="pending-konglo" className="text-micro font-bold uppercase tracking-widest text-amber">Rencana yang dipantau</h2><div className="mt-3 grid gap-3 lg:grid-cols-2">{feed.pending.map((item) => <article key={`${item.slug}-${item.code}`} className="border border-rule-hi bg-panel-hi p-4"><div className="flex flex-wrap items-center gap-2"><Link href={`/asset/${item.code}`} className="text-sm font-bold text-cyan hover:underline">{item.code}</Link><span className="border border-amber-dim px-1.5 py-0.5 text-micro text-amber">BERSYARAT · BELUM DIKONFIRMASI SELESAI</span></div><p className="mt-2 text-xs text-ink">{item.name} / {item.holder} · rencana {item.percentage.toLocaleString("id-ID")}% · diumumkan {item.announcedOn}</p><p className="mt-2 text-xs text-dim">{item.note}</p><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-cyan hover:underline">Baca sumber awal ↗</a></article>)}</div></section>}
  </main>;
}
