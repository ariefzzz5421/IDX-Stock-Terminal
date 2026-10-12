import type { Metadata } from "next";
import Link from "next/link";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";
import { COMPANY_CATALOG } from "@/lib/company-catalog";
import { getFreeFloatSnapshot } from "@/lib/market-data/free-float";
import officialList from "@/data/idx-stock-list-20261012.json";

export const metadata: Metadata = { title: "Daftar Saham BEI — IDX Terminal" };
export const dynamic = "force-dynamic";

const BOARD_NAMES: Record<string, string> = {
  UTAMA: "Papan Utama",
  PENGEMBANGAN: "Papan Pengembangan",
  AKSELERASI: "Papan Akselerasi",
  "EKONOMI BARU": "Papan Ekonomi Baru",
  "PEMANTAUAN KHUSUS": "Papan Pemantauan Khusus",
};
const PAGE_SIZE = 40;

export default async function BeiPage({ searchParams }: { searchParams: Promise<{ q?: string; board?: string; coverage?: string; page?: string }> }) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 50);
  const board = params.board && params.board in BOARD_NAMES ? params.board : "";
  const requestedCoverage = params.coverage === "available" || params.coverage === "missing" ? params.coverage : "";
  const catalog = new Map(COMPANY_CATALOG.map((entry) => [entry.code, entry]));
  const float = await getFreeFloatSnapshot();
  const floatCodes = new Set(float.rows.map((row) => row.code));
  const coverage = float.available ? requestedCoverage : "";
  const rows = officialList.stocks.filter((entry) => {
    if (board && entry.board !== board) return false;
    if (coverage === "available" && !floatCodes.has(entry.code)) return false;
    if (coverage === "missing" && floatCodes.has(entry.code)) return false;
    const name = catalog.get(entry.code)?.name ?? "";
    return `${entry.code} ${name}`.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID"));
  });
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const requested = Number(params.page);
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, pages) : 1;
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const urlFor = (next: number) => `/bei?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(board ? { board } : {}), ...(coverage ? { coverage } : {}), page: String(next) })}`;
  const inCatalog = officialList.stocks.filter((entry) => catalog.has(entry.code)).length;
  const floatCovered = officialList.stocks.filter((entry) => floatCodes.has(entry.code)).length;

  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <p className="text-micro font-bold uppercase tracking-widest text-amber">Bursa Efek Indonesia / daftar saham</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink-hi">BEI</h1>
      <p className="mt-2 max-w-3xl text-xs leading-5 text-ink">Daftar dan papan pencatatan dari unduhan resmi BEI tanggal 12 Oktober 2026. Ini arsip bertanggal; perpindahan papan atau pencatatan baru setelah tanggal tersebut belum tercermin.</p>
      <a href={officialList.source} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-cyan hover:underline">Daftar Saham BEI ↗</a>
    </header>
    <section className="grid gap-px bg-rule sm:grid-cols-3">
      <Metric label="Saham dalam daftar BEI" value={officialList.stocks.length} />
      <Metric label="Cocok dengan katalog situs" value={inCatalog} />
      <Metric label="Data free float tersedia" value={float.available ? floatCovered : null} detail={float.available ? `${officialList.stocks.length - floatCovered} tanpa pasangan data vendor · dicek ${new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }).format(new Date(float.fetchedAt!))} WIB` : "Sumber float sedang tidak tersedia"} />
    </section>
    <section className="grid gap-px border-y border-rule bg-rule sm:grid-cols-2 lg:grid-cols-5" aria-label="Jumlah per papan">
      {Object.entries(BOARD_NAMES).map(([key, name]) => <Link key={key} href={`/bei?board=${encodeURIComponent(key)}`} className={`min-w-0 bg-panel-hi p-4 hover:bg-panel ${board === key ? "text-amber" : "text-ink"}`}><span className="block text-micro uppercase tracking-wider">{name}</span><strong className="mt-1 block text-lg text-ink-hi">{officialList.stocks.filter((entry) => entry.board === key).length}</strong></Link>)}
    </section>
    <form action="/bei" method="get" className="flex flex-wrap gap-2 border-b border-rule p-4 sm:p-6">
      <input name="q" defaultValue={query} placeholder="Cari kode atau emiten" aria-label="Cari kode atau emiten" className="min-h-10 min-w-0 flex-1 border border-rule-hi bg-panel-hi px-3 text-xs text-ink sm:min-w-56" />
      <select name="board" defaultValue={board} aria-label="Papan pencatatan" className="min-h-10 min-w-0 border border-rule-hi bg-panel-hi px-3 text-xs text-ink"><option value="">Semua papan</option>{Object.entries(BOARD_NAMES).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select>
      <select name="coverage" defaultValue={coverage} disabled={!float.available} aria-label="Cakupan data free float" className="min-h-10 min-w-0 border border-rule-hi bg-panel-hi px-3 text-xs text-ink disabled:opacity-50"><option value="">Semua data float</option><option value="available">Float tersedia</option><option value="missing">Float belum tersedia</option></select>
      <button className="min-h-10 border border-amber px-4 text-xs font-bold text-amber hover:bg-amber/10">Tampilkan</button>
    </form>
    <div className="border-b border-rule bg-panel-hi px-4 py-2 text-micro uppercase tracking-wider text-amber sm:px-6">{rows.length} saham · {board ? BOARD_NAMES[board] : "semua papan"}</div>
    <ol className="divide-y divide-rule">{visible.map((stock) => {
      const company = catalog.get(stock.code);
      return <li key={stock.code} className="grid min-w-0 gap-2 px-4 py-3 text-xs hover:bg-panel-hi sm:grid-cols-[minmax(0,1fr)_minmax(7rem,12rem)_minmax(7rem,12rem)] sm:items-center sm:gap-4 sm:px-6">
        <Link href={`/asset/${stock.code}`} className="flex min-w-0 items-center gap-2 text-cyan hover:underline"><CompanyLogo code={stock.code} size="sm" /><span className="min-w-0"><strong className="block text-ink-hi">{stock.code}</strong><span className="block truncate text-ink">{company?.name ?? "Nama belum ada di katalog"}</span></span></Link>
        <span className="text-ink">{BOARD_NAMES[stock.board]}</span>
        <span className="flex flex-wrap gap-2 sm:justify-end"><Link href={`/asset/${stock.code}`} className="text-cyan hover:underline">Profil saham ↗</Link>{floatCodes.has(stock.code) && <Link href={`/free-float/asset/${stock.code}`} className="text-amber hover:underline">Float ↗</Link>}</span>
      </li>;
    })}</ol>
    {rows.length === 0 && <p className="p-6 text-xs text-ink">Tidak ada saham yang cocok.</p>}
    <nav aria-label="Halaman daftar saham BEI" className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-4 text-xs sm:px-6"><span className="text-dim">Halaman {page}/{pages}</span><div className="flex gap-2">{page > 1 && <Link href={urlFor(page - 1)} className="border border-rule-hi px-3 py-2 text-ink">Sebelumnya</Link>}{page < pages && <Link href={urlFor(page + 1)} className="border border-rule-hi px-3 py-2 text-ink">Berikutnya</Link>}</div></nav>
    <p className="border-t border-rule px-4 py-4 text-micro leading-5 text-dim sm:px-6">Cakupan float dihitung dari snapshot TradingView yang tersedia saat halaman dibuka. Ketidaktersediaan angka float tidak berarti saham tidak memiliki free float. Papan Pemantauan Khusus ditampilkan sesuai kolom papan dalam daftar BEI.</p>
  </main>;
}

function Metric({ label, value, detail }: { label: string; value: number | null; detail?: string }) {
  return <div className="min-w-0 bg-panel px-4 py-3 sm:px-6"><span className="block text-micro uppercase tracking-wider text-dim">{label}</span><strong className="mt-1 block text-sm text-ink-hi">{value === null ? "N/D" : value.toLocaleString("id-ID")}</strong>{detail && <span className="mt-1 block text-micro text-dim">{detail}</span>}</div>;
}
