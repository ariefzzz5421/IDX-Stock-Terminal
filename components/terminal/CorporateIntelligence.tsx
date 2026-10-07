import Link from "next/link";
import { AlertTriangle, ArrowRight, FileSearch, ShieldCheck } from "lucide-react";
import { intelligenceOverview, listResearch, researchRunHistory, type ResearchFilters } from "@/lib/intelligence/queries";
import { isResearchAdmin } from "@/lib/intelligence/access";
import { ResearchControls } from "./ResearchControls";
import { CATEGORIES } from "@/lib/intelligence/core";
import { runOutcome, scanHeadline } from "@/lib/intelligence/scan-presentation";
import { sessionLabel } from "@/lib/intelligence/schedule";
import { CompanyLogo } from "./CompanyLogo";
import { ResearchClock } from "./ResearchClock";

function date(value: Date | null | undefined) {
  return value ? new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }).format(value) + " WIB" : "N/D";
}
const categoryOptions = CATEGORIES;
const field = "min-h-9 min-w-0 border border-rule-hi bg-panel px-2 text-xs text-ink";

export async function CorporateIntelligence({ userId, filters, historyPage }: { userId: string; filters: ResearchFilters; historyPage: number }) {
  const [overview, listing, history, admin] = await Promise.all([intelligenceOverview(userId), listResearch(filters, userId), researchRunHistory(historyPage), isResearchAdmin()]);
  const run = overview.latestRun;
  const inputRate = Number(process.env.OPENAI_INPUT_USD_PER_MILLION);
  const outputRate = Number(process.env.OPENAI_OUTPUT_USD_PER_MILLION);
  const estimatedCost = process.env.OPENAI_INPUT_USD_PER_MILLION && process.env.OPENAI_OUTPUT_USD_PER_MILLION && Number.isFinite(inputRate) && Number.isFinite(outputRate) && inputRate >= 0 && outputRate >= 0 && run
    ? `US$${((run.aiInputTokens * inputRate + run.aiOutputTokens * outputRate) / 1_000_000).toFixed(4)}` : "N/D";
  const pageLink = (page: number) => {
    const p = new URLSearchParams();
    if (filters.q) p.set("q", filters.q);
    if (filters.ticker) p.set("ticker", filters.ticker);
    for (const value of filters.categories ?? []) p.append("category", value);
    for (const value of filters.priorities ?? []) p.append("priority", value);
    for (const value of filters.statuses ?? []) p.append("status", value);
    for (const value of filters.directions ?? []) p.append("direction", value);
    if (filters.from) p.set("from", filters.from);
    if (filters.latest) p.set("latest", "1");
    if (filters.watchlist) p.set("watchlist", "1");
    if (filters.sort) p.set("sort", filters.sort);
    if (history.page > 1) p.set("historyPage", String(history.page));
    p.set("page", String(page));
    return `/ai-analyst?${p.toString()}`;
  };
  const historyLink = (page: number) => {
    const url = new URL(pageLink(listing.page), "https://idx-terminal.local");
    url.searchParams.set("historyPage", String(page));
    return `${url.pathname}${url.search}#research-history`;
  };
  const clear = scanHeadline(run, new Date());
  return <section className="min-w-0 border-b border-rule bg-panel">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-rule px-4 py-5 sm:px-6">
      <div>
        <p className="text-micro font-bold uppercase tracking-widest text-amber">Corporate intelligence / arsip terverifikasi</p>
        <h2 className="mt-1 flex items-center gap-2 font-display text-xl font-bold text-ink-hi"><FileSearch className="h-5 w-5 text-amber" /> Intelijen Korporasi</h2>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-ink">Pengumuman resmi ditelusuri ke dokumen asal. Prioritas adalah materialitas, bukan prediksi harga.</p>
        <p className="mt-1 text-xs text-cyan">Riset berjalan otomatis Senin–Jumat sekitar 08.00 dan 21.00 WIB. Waktu nyata setiap scan tercatat di riwayat.</p>
      </div>
      <div className="flex min-w-0 flex-col items-start gap-2 sm:items-end">
        <div className="text-micro uppercase tracking-widest text-dim">Waktu sekarang · Jakarta</div>
        <ResearchClock initialTime={new Date().toISOString()} />
        <ResearchControls admin={admin} unread={overview.unread} />
      </div>
    </header>
    <div className="grid gap-px bg-rule sm:grid-cols-2 xl:grid-cols-5">
      <Metric label="Scan berhasil terakhir" value={date(overview.latestSuccess?.endedAt)} />
      <Metric label="Alert 24 jam" value={String(overview.recentEvents)} />
      <Metric label="Critical / High" value={String(overview.priorityCount)} />
      <Metric label="Saham terdampak" value={String(overview.affected)} />
      <Metric label="Confirmed / Preliminary" value={`${overview.confirmed} / ${overview.preliminary}`} />
    </div>
    <div className={`flex flex-wrap items-center gap-2 border-b border-rule px-4 py-3 text-xs sm:px-6 ${run?.status === "FAILED" || run?.status === "PARTIAL" ? "text-amber" : "text-ink"}`}>
      {run?.status === "SUCCESS" ? <ShieldCheck className="h-4 w-4 shrink-0 text-cyan" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-amber" />}
      <strong>{clear}</strong>
      <span className="text-dim">Scan mulai {date(run?.startedAt)} · selesai {date(run?.endedAt)} · {run?.sourcesChecked ?? 0} dokumen diperiksa · {run?.failedAdapters ?? 0} feed gagal</span>
    </div>
    <details className="border-b border-rule px-4 py-3 text-xs sm:px-6">
      <summary className="cursor-pointer font-bold text-cyan">Cakupan sumber dan kesehatan pipeline</summary>
      <div className="mt-3 grid gap-3 text-ink lg:grid-cols-2">
        <div><strong className="text-ink-hi">Aktif:</strong> KSEI jadwal HMETD, dividen tunai/saham/campuran, bonus saham, dan MASR. PDF diambil dari host resmi dan diperiksa ulang saat isinya berubah.</div>
        <ul className="space-y-1">{overview.sourceGaps.map((gap) => <li key={gap}>• {gap}</li>)}</ul>
      </div>
      {run && run.errorLog !== "[]" && <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap border border-rule p-2 text-down">{(JSON.parse(run.errorLog) as string[]).join("\n")}</pre>}
      {admin && <div className="mt-3 border-t border-rule pt-3 text-ink">
        <strong>Diagnostik admin:</strong> API {process.env.OPENAI_API_KEY ? "terkonfigurasi" : "tidak tersedia"} · model {process.env.OPENAI_MODEL ?? "N/D"} · mulai {date(run?.startedAt)} · selesai {date(run?.endedAt)} · token input/output {run?.aiInputTokens ?? 0}/{run?.aiOutputTokens ?? 0} · estimasi biaya {estimatedCost}.
      </div>}
    </details>
    <form action="/ai-analyst" method="get" className="grid gap-2 border-b border-rule bg-panel-hi p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <input className={field} name="q" aria-label="Cari riset" placeholder="Cari peristiwa" defaultValue={filters.q} />
      <input className={field} name="ticker" aria-label="Kode saham" placeholder="Kode saham" defaultValue={filters.ticker} maxLength={8} />
      <FilterGroup name="category" label="Kategori" options={categoryOptions} selected={filters.categories} />
      <FilterGroup name="priority" label="Prioritas" options={["CRITICAL", "HIGH", "MEDIUM", "WATCH"]} selected={filters.priorities} />
      <FilterGroup name="status" label="Status" options={["CONFIRMED", "PRELIMINARY", "UNCONFIRMED", "SUPERSEDED"]} selected={filters.statuses} />
      <FilterGroup name="direction" label="Dampak" options={["POSITIVE", "NEGATIVE", "MIXED", "NEUTRAL", "UNCERTAIN"]} selected={filters.directions} />
      <input className={field} name="from" type="date" aria-label="Dari tanggal" defaultValue={filters.from} />
      <select className={field} name="sort" defaultValue={filters.sort ?? "newest"} aria-label="Urutan"><option value="newest">Terbaru</option><option value="oldest">Terlama</option><option value="priority">Materialitas</option></select>
      <label className="flex items-center gap-2 text-xs text-ink"><input type="checkbox" name="latest" value="1" defaultChecked={filters.latest} />Pembaruan terbaru</label>
      <label className="flex items-center gap-2 text-xs text-ink"><input type="checkbox" name="watchlist" value="1" defaultChecked={filters.watchlist} />Watchlist saya</label>
      <button className="min-h-9 border border-amber px-3 text-xs font-bold text-amber hover:bg-amber/10">Terapkan filter</button>
    </form>
    <div className="border-b border-rule bg-panel-hi px-4 py-2 text-micro font-bold uppercase tracking-widest text-amber sm:px-6">Riset terbaru · {listing.total} peristiwa</div>
    {listing.events.length ? <div className="grid gap-px bg-rule lg:grid-cols-2">{listing.events.map((event) => {
      const latest = event.versions[0];
      const facts = latest ? JSON.parse(latest.factsJson) as { evidence?: Array<{ claim: string }> } : null;
      return <article key={event.id} className="min-w-0 bg-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-micro font-bold uppercase tracking-widest">
          {event.tickers[0] && <CompanyLogo code={event.tickers[0].stockCode} size="md" />}
          <span className="text-cyan">{event.tickers[0]?.stockCode ?? "N/D"}</span><span className="text-amber">{event.category.replaceAll("_", " ")}</span>
          <span className="border border-rule-hi px-1.5 py-0.5 text-ink">{event.priority}</span><span className={event.status === "CONFIRMED" ? "text-up" : "text-amber"}>{event.status}</span>
        </div>
        <h3 className="mt-2 text-sm font-bold text-ink-hi">{event.title}</h3>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-ink">{event.summary}</p>
        <p className="mt-2 text-micro text-ink">Riset terbit {date(latest?.publishedAt)} · Pengumuman {date(latest?.announcementAt)} · Berlaku {date(latest?.effectiveAt)} · Versi {event.latestVersion} · Dampak {event.direction}</p>
        {facts?.evidence?.[0] && <p className="mt-2 line-clamp-2 text-xs text-dim">Fakta: {facts.evidence[0].claim}</p>}
        <div className="mt-3 flex flex-wrap gap-3 text-xs"><Link href={`/ai-analyst/research/${event.id}`} className="inline-flex items-center gap-1 font-bold text-amber hover:underline">Buka riset <ArrowRight className="h-3 w-3" /></Link><a href={latest?.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Dokumen asli ↗</a>{event.tickers.map((ticker) => <Link key={ticker.securityCode} href={`/asset/${ticker.stockCode}`} className="text-cyan hover:underline">{ticker.securityCode}</Link>)}</div>
      </article>;
    })}</div> : <p className="px-4 py-8 text-sm text-ink sm:px-6">Belum ada riset yang memenuhi filter. Dokumen yang belum diverifikasi tidak ditampilkan sebagai temuan.</p>}
    {listing.total > 20 && <div className="flex gap-3 border-t border-rule px-4 py-3 text-xs">{listing.page > 1 && <Link href={pageLink(listing.page - 1)} className="text-cyan">← Sebelumnya</Link>}<span className="text-ink">Halaman {listing.page}</span>{listing.page * 20 < listing.total && <Link href={pageLink(listing.page + 1)} className="text-cyan">Berikutnya →</Link>}</div>}
    <section id="research-history" className="border-t border-rule">
      <h3 className="bg-panel-hi px-4 py-2 text-micro font-bold uppercase tracking-widest text-amber sm:px-6">Riwayat pemindaian · {history.total} sesi</h3>
      {history.runs.length ? <ol className="divide-y divide-rule">{history.runs.map((item) => <li key={item.id} className="grid min-w-0 gap-1 px-4 py-3 text-xs sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1.5fr)_auto] sm:items-center sm:gap-4 sm:px-6">
        <div className="min-w-0"><strong className="text-ink-hi">{date(item.startedAt)}</strong><span className="ml-2 text-dim">{sessionLabel(item.slot)}</span></div>
        <div className={item.status === "SUCCESS" ? "text-cyan" : "text-amber"}>{runOutcome(item)}</div>
        <div className="text-dim">{item.sourcesChecked} dokumen · {item.failedAdapters} feed gagal · selesai {date(item.endedAt)}</div>
      </li>)}</ol> : <p className="px-4 py-4 text-xs text-ink sm:px-6">Belum ada pemindaian yang tersimpan.</p>}
      {history.total > 10 && <nav aria-label="Halaman riwayat pemindaian" className="flex gap-4 border-t border-rule px-4 py-3 text-xs sm:px-6">{history.page > 1 && <Link href={historyLink(history.page - 1)} className="text-cyan">← Lebih baru</Link>}<span className="text-ink">Halaman {history.page}</span>{history.page * 10 < history.total && <Link href={historyLink(history.page + 1)} className="text-cyan">Lebih lama →</Link>}</nav>}
    </section>
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 bg-panel px-4 py-3"><p className="text-micro uppercase tracking-widest text-dim">{label}</p><p className="mt-1 break-words text-sm font-bold text-ink-hi">{value}</p></div>;
}
function FilterGroup({ name, label, options, selected }: { name: string; label: string; options: readonly string[]; selected?: string[] }) {
  return <details className="relative min-w-0 border border-rule-hi bg-panel text-xs text-ink"><summary className="flex min-h-9 cursor-pointer items-center px-2">{label}{selected?.length ? ` (${selected.length})` : ""}</summary><div className="absolute z-20 max-h-56 min-w-48 overflow-y-auto border border-rule-hi bg-panel p-2 shadow-xl">{options.map((option) => <label key={option} className="flex items-center gap-2 py-1"><input type="checkbox" name={name} value={option} defaultChecked={selected?.includes(option)} />{option.replaceAll("_", " ")}</label>)}</div></details>;
}
