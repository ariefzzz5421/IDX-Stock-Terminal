import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getFreeFloatSnapshot, type FloatStock } from "@/lib/market-data/free-float";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";

export const metadata: Metadata = { title: "Free Float — IDX Terminal" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;
const shares = (value: number) => Math.round(value).toLocaleString("id-ID");
const percentage = (value: number) => `${value.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const rupiah = (value: number | null) => value === null ? "N/D" : `Rp ${(value / 1e12).toLocaleString("id-ID", { maximumFractionDigits: 2 })} T`;

function FloatRow({ stock, rank }: { stock: FloatStock; rank: number }) {
  return <li className="border-b border-rule last:border-0">
    <Link href={`/free-float/asset/${stock.code}`} className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 hover:bg-panel-hi md:grid-cols-[2rem_minmax(0,1fr)_8rem_8rem_6rem_8rem_1rem] md:gap-3 md:px-6">
      <span className="text-xs tabular-nums text-dim">{rank}.</span>
      <span className="flex min-w-0 items-center gap-2"><CompanyLogo code={stock.code} /><span className="min-w-0"><strong className="block font-display text-sm text-ink-hi">{stock.code}</strong><span className="block truncate text-micro text-dim" title={stock.name}>{stock.name}</span></span></span>
      <span className="text-right md:contents"><strong className="font-display text-sm tabular-nums text-amber md:order-3 md:text-right">{percentage(stock.floatPercent)}</strong><span className="block text-micro tabular-nums text-dim md:order-1 md:text-right md:text-xs md:text-ink">{shares(stock.floatShares)}</span></span>
      <span className="hidden text-right text-xs tabular-nums text-ink md:order-2 md:block">{shares(stock.outstandingShares)}</span>
      <span className="hidden text-right text-xs tabular-nums text-dim md:order-4 md:block">{rupiah(stock.marketCap)}</span>
      <ArrowRight aria-hidden="true" className="hidden h-3.5 w-3.5 text-amber md:order-5 md:block" />
    </Link>
  </li>;
}

export default async function FreeFloatPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; page?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 40);
  const sort = params.sort === "market-cap" || params.sort === "largest-float" ? params.sort : "lowest-float";
  const snapshot = await getFreeFloatSnapshot();
  const filtered = snapshot.rows.filter((item) => `${item.code} ${item.name}`.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID")));
  filtered.sort(sort === "market-cap"
    ? (a, b) => (b.marketCap ?? -1) - (a.marketCap ?? -1) || a.code.localeCompare(b.code)
    : sort === "largest-float"
      ? (a, b) => b.floatPercent - a.floatPercent || a.code.localeCompare(b.code)
      : (a, b) => a.floatPercent - b.floatPercent || a.code.localeCompare(b.code));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requestedPage = Number(params.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, pages) : 1;
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageHref = (next: number) => `/free-float?${new URLSearchParams({ ...(query ? { q: query } : {}), sort, page: String(next) })}`;
  const refreshed = snapshot.fetchedAt ? new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.fetchedAt)) : null;

  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <p className="text-micro uppercase tracking-[0.18em] text-amber">Ownership intelligence / free float</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink-hi">Free Float</h1>
      <p className="mt-2 max-w-4xl text-xs leading-relaxed text-dim">Peta saham beredar publik ala StockMap, dikurasi ulang dari data float dan saham beredar TradingView saat halaman dibuka. Angka ini estimasi penyedia data, bukan angka free float resmi BEI atau pergerakan intraday. Persentase = saham float ÷ saham beredar.</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-micro text-cyan"><a href="https://www.tradingview.com/support/solutions/43000670341-free-float/" target="_blank" rel="noopener noreferrer" className="hover:underline">Metodologi TradingView ↗</a><a href="https://data.idx.co.id/catalog_product2.php?p=XLoi5RtfUJ8SBrm" target="_blank" rel="noopener noreferrer" className="hover:underline">Data resmi IDX Free Float ↗</a></div>
    </header>
    <section className="grid grid-cols-2 border-b border-rule bg-panel-hi sm:grid-cols-4">
      {[["Cakupan float", `${snapshot.rows.length.toLocaleString("id-ID")} emiten`], ["Di bawah 15% · estimasi", `${snapshot.rows.filter((item) => item.floatPercent < 15).length.toLocaleString("id-ID")} emiten`], ["Sumber", "TradingView"], ["Dicek", refreshed ? `${refreshed} WIB` : "Tidak tersedia"]].map(([label, value]) => <div key={label} className="min-w-0 border-b border-r border-rule px-4 py-3 sm:border-b-0 sm:px-6"><span className="block text-micro uppercase tracking-wider text-dim">{label}</span><strong className="mt-1 block break-words font-display text-sm text-ink-hi">{value}</strong></div>)}
    </section>
    <form action="/free-float" className="flex flex-col gap-2 border-b border-rule px-4 py-3 sm:flex-row sm:items-center sm:px-6">
      <label className="flex min-w-0 flex-1 items-center gap-2 border border-rule-hi bg-void px-3 focus-within:border-amber"><Search className="h-4 w-4 shrink-0 text-amber" aria-hidden="true" /><input type="search" name="q" defaultValue={query} maxLength={40} placeholder="Cari emiten atau kode" aria-label="Cari emiten atau kode" className="min-h-11 min-w-0 flex-1 bg-transparent text-xs text-ink-hi outline-none placeholder:text-dim" /></label>
      <label className="flex items-center gap-2 text-xs text-dim">Urutkan <select name="sort" defaultValue={sort} className="min-h-11 flex-1 border border-rule-hi bg-void px-3 text-ink-hi sm:flex-initial"><option value="lowest-float">Float Terkecil</option><option value="largest-float">Float Terbesar</option><option value="market-cap">Market cap terbesar</option></select></label>
      <button type="submit" className="min-h-11 border border-amber px-4 text-xs font-bold uppercase text-amber hover:bg-amber/10">Terapkan</button>
    </form>
    {!snapshot.available ? <p className="px-4 py-8 text-sm text-dim sm:px-6">Data float belum tersedia dari TradingView. Coba buka kembali beberapa saat lagi.</p> : filtered.length === 0 ? <p className="px-4 py-8 text-sm text-dim sm:px-6">Tidak ada emiten yang cocok atau memiliki data float dan saham beredar lengkap.</p> : <>
      <div className="hidden grid-cols-[2rem_minmax(0,1fr)_8rem_8rem_6rem_8rem_1rem] gap-3 border-b border-rule px-6 py-3 text-micro uppercase tracking-wider text-dim md:grid"><span>#</span><span>Emiten</span><span className="text-right">Float shares</span><span className="text-right">Saham beredar</span><span className="text-right">Float %</span><span className="text-right">Market cap</span><span /></div>
      <ol>{visible.map((stock, index) => <FloatRow key={stock.code} stock={stock} rank={(page - 1) * PAGE_SIZE + index + 1} />)}</ol>
      <nav aria-label="Halaman free float" className="flex items-center justify-between gap-3 border-t border-rule px-4 py-4 text-xs sm:px-6"><span className="text-dim">{filtered.length.toLocaleString("id-ID")} hasil · halaman {page}/{pages}</span><div className="flex gap-2">{page > 1 && <Link href={pageHref(page - 1)} className="border border-rule-hi px-3 py-2 text-ink hover:border-amber">Sebelumnya</Link>}{page < pages && <Link href={pageHref(page + 1)} className="border border-rule-hi px-3 py-2 text-ink hover:border-amber">Berikutnya</Link>}</div></nav>
    </>}
    <p className="border-t border-rule px-4 py-4 text-micro leading-relaxed text-dim sm:px-6">Ambang 15% hanya penanda riset berdasarkan estimasi vendor; status kepatuhan resmi harus dicek pada laporan dan data BEI terbaru. Saham tanpa pasangan data float/beredar tidak dipaksakan masuk daftar.</p>
  </main>;
}
