import type { Metadata } from "next";
import Link from "next/link";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";
import { COMPANY_CATALOG } from "@/lib/company-catalog";
import { getReconciledSuspensions } from "@/lib/market-data/suspension-reference";
import {
  SUSPENSION_ARCHIVE_SOURCE,
  SUSPENSION_ANNOUNCEMENTS_SOURCE,
} from "@/lib/market-data/suspension-archive";

export const metadata: Metadata = { title: "Saham Suspensi BEI — IDX Terminal" };
export const dynamic = "force-dynamic";

const PER_PAGE = 40;
const companyByCode = new Map(COMPANY_CATALOG.map(c => [c.code, c]));

function dateID(iso: string) {
  const d = new Date(iso + "T12:00:00+07:00");
  if (!Number.isFinite(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric",
  }).format(d);
}

export default async function SuspensionPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const [params, source] = await Promise.all([searchParams, getReconciledSuspensions()]);
  const q = (params.q ?? "").trim().slice(0, 40);
  const filtered = source.rows.filter(r => {
    const company = companyByCode.get(r.code);
    return (r.code + " " + (company?.name ?? "")).toLowerCase().includes(q.toLowerCase());
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const num = Number(params.page ?? "1");
  const page = Number.isSafeInteger(num) && num > 0 ? Math.min(num, totalPages) : 1;
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const href = (p: number) => "/suspensi?" + new URLSearchParams({
    ...(q ? { q } : {}), page: String(p),
  }).toString();
  const asOf = dateID(source.asOf);

  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <p className="text-micro font-semibold uppercase tracking-widest text-amber">BEI / Status perdagangan</p>
      <h1 className="mt-1 font-display text-2xl font-bold uppercase text-ink-hi">Saham Suspensi</h1>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-ink">
        Daftar saham dari arsip suspensi BEI per <strong>{asOf}</strong>, diselaraskan dengan pengumuman suspend / unsuspend BEI yang berhasil diperiksa. Badge <strong>SUSPEND</strong> tidak muncul lagi ketika ada pengumuman unsuspend yang lebih baru. Ini bukan feed status real-time.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
        <a href={SUSPENSION_ARCHIVE_SOURCE} target="_blank" rel="noopener noreferrer" className="text-cyan underline-offset-4 hover:underline">Daftar suspensi BEI ↗</a>
        <a href={SUSPENSION_ANNOUNCEMENTS_SOURCE} target="_blank" rel="noopener noreferrer" className="text-cyan underline-offset-4 hover:underline">Pengumuman suspend / unsuspend terbaru ↗</a>
        <Link href="/bei" className="text-amber hover:underline">Daftar seluruh saham BEI ↗</Link>
      </div>
    </header>

    <section className="grid grid-cols-2 gap-px bg-rule">
      <div className="bg-panel-hi px-4 py-3 sm:px-6">
        <span className="block text-micro uppercase tracking-wide text-dim">Saham pada daftar</span>
        <strong className="mt-1 block font-display text-xl font-bold tabular-nums text-ink-hi">{source.rows.length.toLocaleString("id-ID")}</strong>
      </div>
      <div className="bg-panel-hi px-4 py-3 sm:px-6">
        <span className="block text-micro uppercase tracking-wide text-dim">Tanggal referensi BEI</span>
        <strong className="mt-1 block text-xs font-bold text-ink-hi">{asOf}</strong>
      </div>
    </section>

    <div className="border-b border-rule px-4 py-3 text-xs leading-5 text-dim sm:px-6">
      <strong className="text-amber">Status data:</strong> {source.note}
      <span className="block pt-2">Emiten yang tidak diperdagangkan atau terkena ARB belum tentu suspend. Selalu cocokkan kondisi terkini di pengumuman BEI.</span>
    </div>

    <form action="/suspensi" method="get" className="flex gap-2 border-b border-rule px-4 py-4 sm:px-6">
      <input name="q" defaultValue={q} placeholder="Cari saham atau perusahaan..." aria-label="Cari saham suspensi"
        className="min-w-0 min-h-10 flex-1 border border-rule-hi bg-panel-hi px-3 text-xs text-ink placeholder:text-dim" />
      <button type="submit" className="min-h-10 border border-amber px-4 text-xs font-bold text-amber hover:bg-amber/10">Cari</button>
    </form>

    <ol className="divide-y-2 divide-rule-hi/70">
      {visible.map((item) => {
        const company = companyByCode.get(item.code);
        return <li key={item.code} className="flex min-w-0 items-start gap-3 px-4 py-4 hover:bg-panel-hi sm:px-6">
          <Link href={"/asset/" + item.code} aria-label={"Lihat " + item.code} className="mt-0.5 shrink-0">
            <CompanyLogo code={item.code} size="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={"/asset/" + item.code} className="font-display text-base font-bold text-ink-hi hover:text-amber">{item.code}</Link>
              <span title={"Berdasarkan " + (item.basis === "new-announcement" ? "pengumuman terbaru" : "arsip suspensi 6 bulan") + " BEI per " + item.asOf + ". Cek status perdagangan terkini."} className="rounded-sm border border-amber/70 px-1.5 py-0.5 text-[10px] font-bold text-amber">SUSPEND</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-ink">{company?.name ?? "Nama tidak tersedia dalam katalog situs"}</p>
          </div>
        </li>;
      })}
    </ol>
    {!filtered.length && <p className="px-4 py-6 text-sm text-dim sm:px-6">Tidak ditemukan pada arsip BEI ini.</p>}
    <nav aria-label="Halaman arsip suspensi" className="flex items-center justify-between gap-2 border-t border-rule px-4 py-4 text-xs sm:px-6">
      <span className="text-dim">{filtered.length} saham · Halaman {page}/{totalPages}</span>
      <div className="flex gap-2">
        {page > 1 && <Link href={href(page - 1)} className="border border-rule-hi px-3 py-2 text-ink">Sebelumnya</Link>}
        {page < totalPages && <Link href={href(page + 1)} className="border border-rule-hi px-3 py-2 text-ink">Berikutnya</Link>}
      </div>
    </nav>
    <footer className="border-t border-rule px-4 py-4 text-micro leading-5 text-dim sm:px-6">
      Sumber: Bursa Efek Indonesia · arsip suspensi lebih dari enam bulan + pengumuman terbaru yang dapat dibaca.
      Keputusan investasi memerlukan konfirmasi bursa terkini; daftar ini tidak dijamin selalu lengkap.
    </footer>
  </main>;
}
