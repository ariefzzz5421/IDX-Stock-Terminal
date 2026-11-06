import type { Metadata } from "next";
import Link from "next/link";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";
import { getLatestIdxStockSummary } from "@/lib/market-data/idx-official";

export const metadata: Metadata = { title: "Ringkasan Saham BEI — IDX Terminal" };
export const dynamic = "force-dynamic";

const BEI_URL = "https://www.idx.id/id/data-pasar/ringkasan-perdagangan/ringkasan-saham/";
const PAGE_SIZE = 50;
const id = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const money = (n: number | null) => n === null ? "N/D" : "Rp " + id.format(n);
const numeric = (n: number | null) => n === null ? "N/D" : id.format(n);

type SortKey = "value" | "volume" | "frequency" | "code";

export default async function RingkasanSahamPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const summary = await getLatestIdxStockSummary();
  const query = (params.q ?? "").trim().slice(0, 40);
  const sort: SortKey = ["value", "volume", "frequency", "code"].includes(params.sort ?? "")
    ? params.sort as SortKey : "value";
  const available = summary.available && summary.date !== null && summary.rows.length >= 700;
  const rows = available ? summary.rows : [];
  const filtered = rows.filter(row => (
    (row.code + " " + row.name).toLocaleLowerCase("id-ID")
      .includes(query.toLocaleLowerCase("id-ID"))
  ));
  filtered.sort((a, b) => sort === "code"
    ? a.code.localeCompare(b.code)
    : (b[sort] ?? -1) - (a[sort] ?? -1) || a.code.localeCompare(b.code));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requestedPage = Number(params.page ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, pages) : 1;
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = rows.reduce((acc, row) => ({
    value: acc.value + (row.value ?? 0),
    volume: acc.volume + (row.volume ?? 0),
    frequency: acc.frequency + (row.frequency ?? 0),
  }), { value: 0, volume: 0, frequency: 0 });
  const pageLink = (next: number) => {
    const p = new URLSearchParams({ sort, page: String(next) });
    if (query) p.set("q", query);
    return "/bei/ringkasan?" + p.toString();
  };
  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <p className="text-micro font-bold uppercase tracking-widest text-amber">BEI / official end-of-day reference</p>
      <h1 className="mt-1 font-display text-2xl font-bold uppercase text-ink-hi">Ringkasan Saham</h1>
      <p className="mt-2 max-w-4xl text-xs leading-5 text-ink">
        Data harian BEI: harga penutupan, volume dalam lembar saham, nilai transaksi dalam rupiah,
        dan frekuensi transaksi. Kolom <strong>Nilai TX</strong> memakai field resmi <code>Value</code>,
        bukan harga terakhir dikalikan volume. Bukan feed real-time.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <Link href="/bei" className="text-amber hover:underline">← Daftar emiten</Link>
        <Link href="/market" className="text-cyan hover:underline">Market intraday ↗</Link>
        <a href={BEI_URL} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Cek langsung di BEI ↗</a>
      </div>
    </header>
    <div className="grid gap-px bg-rule sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Tanggal perdagangan BEI" value={available ? summary.date! : "Tidak tersedia"} />
      <Metric label="Jumlah saham" value={available ? numeric(rows.length) : "N/D"} />
      <Metric label="Total nilai transaksi" value={available ? money(total.value) : "N/D"} />
      <Metric label="Total volume lembar" value={available ? numeric(total.volume) : "N/D"} />
    </div>
    <p className="border-y border-rule bg-panel-hi px-4 py-3 text-xs leading-5 text-ink sm:px-6">
      <strong className="text-amber">{available ? "BEI EOD tersedia" : "BEI EOD belum tersedia"}</strong>
      {" · "}Tanggal yang ditampilkan adalah tanggal data perdagangan, bukan waktu server mengambilnya.
      Data intraday TradingView/Yahoo dapat berbeda karena delay, cakupan sesi/pasar, dan pembulatan.
      Jangan membandingkan snapshot intraday dengan EOD berbeda tanggal sebagai data serentak.
    </p>
    {!available ? <section className="p-6 text-sm leading-6 text-ink">
      Pembacaan Ringkasan Saham BEI tidak tersedia atau responsnya belum cukup lengkap dan terverifikasi.
      IDX Terminal tidak mengisi nilai transaksi dengan angka perkiraan.{" "}
      <a href={BEI_URL} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Buka sumber resmi BEI</a>.
    </section> : <>
      <form action="/bei/ringkasan" method="get" className="flex flex-wrap gap-2 border-b border-rule p-4 sm:p-6">
        <input name="q" defaultValue={query} aria-label="Cari emiten" placeholder="Cari saham: DEWA, BBCA..." className="min-h-10 min-w-0 flex-1 border border-rule-hi bg-panel-hi px-3 text-xs text-ink sm:min-w-52" />
        <select name="sort" defaultValue={sort} aria-label="Urutkan berdasarkan" className="min-h-10 border border-rule-hi bg-panel-hi px-3 text-xs text-ink">
          <option value="value">Nilai transaksi terbesar</option>
          <option value="volume">Volume saham terbesar</option>
          <option value="frequency">Frekuensi transaksi</option>
          <option value="code">Kode saham A–Z</option>
        </select>
        <button className="min-h-10 border border-amber px-4 text-xs font-bold text-amber hover:bg-amber/10">Tampilkan</button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-xs tabular-nums">
          <thead className="bg-panel-hi text-left text-micro uppercase tracking-wider text-dim">
            <tr>
              <th scope="col" className="px-4 py-3">Emiten</th>
              <th scope="col" className="px-3 py-3 text-right">Close</th>
              <th scope="col" className="px-3 py-3 text-right">Change</th>
              <th scope="col" className="px-3 py-3 text-right">Volume Shares</th>
              <th scope="col" className="px-3 py-3 text-right">Nilai TX (Rp)</th>
              <th scope="col" className="px-4 py-3 text-right">Frekuensi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/70">
            {visible.map(row => {
              const change = row.close !== null && row.previous !== null && row.previous > 0
                ? (row.close - row.previous) / row.previous * 100 : null;
              return <tr key={row.code} className="hover:bg-panel-hi">
                <td className="px-4 py-2">
                  <Link href={"/asset/" + row.code} className="flex items-center gap-2 hover:text-amber">
                    <CompanyLogo code={row.code} size="sm" />
                    <span><strong className="block text-ink-hi">{row.code}</strong><span className="block max-w-52 truncate text-micro text-dim">{row.name}</span></span>
                  </Link>
                </td>
                <td className="px-3 py-2 text-right text-ink-hi">{money(row.close)}</td>
                <td className={"px-3 py-2 text-right " + (change === null ? "text-dim" : change > 0 ? "text-up" : change < 0 ? "text-down" : "text-ink")}>{change === null ? "N/D" : (change > 0 ? "+" : "") + change.toFixed(2) + "%"}</td>
                <td className="px-3 py-2 text-right text-ink">{numeric(row.volume)}</td>
                <td className="px-3 py-2 text-right font-semibold text-cyan">{money(row.value)}</td>
                <td className="px-4 py-2 text-right text-ink">{numeric(row.frequency)}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="p-6 text-xs text-ink">Tidak ada saham yang cocok.</p>}
      <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-4 text-xs sm:px-6" aria-label="Halaman ringkasan">
        <span className="text-dim">{filtered.length} emiten · Halaman {page}/{pages}</span>
        <div className="flex gap-2">
          {page > 1 && <Link href={pageLink(page - 1)} className="border border-rule-hi px-3 py-2 text-ink">Sebelumnya</Link>}
          {page < pages && <Link href={pageLink(page + 1)} className="border border-rule-hi px-3 py-2 text-ink">Berikutnya</Link>}
        </div>
      </nav>
    </>}
    <footer className="border-t border-rule px-4 py-4 text-micro leading-5 text-dim sm:px-6">
      Source: BEI Ringkasan Saham · EOD, tidak boleh diinterpretasikan sebagai feed harga live.
      Jika BEI memblokir akses otomatis, kunjungi situs sumber; data tidak direkayasa.
      Volume adalah lembar saham, bukan lot. Nilai TX adalah rupiah, bukan Rp/lot.
    </footer>
  </main>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 bg-panel px-4 py-3 sm:px-6"><span className="block text-micro uppercase tracking-wider text-dim">{label}</span><strong className="mt-1 block text-sm text-ink-hi">{value}</strong></div>;
}
