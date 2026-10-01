import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";
import { PortfolioDonut } from "@/components/konglo/PortfolioDonut";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { FORBES_LIST_DATE, FORBES_LIST_URL, KONGLO_PROFILES, PRICE_SOURCE_URL, kongloHoldings, kongloPortfolioSummary } from "@/lib/konglo";
import { formatRupiahCompact, formatShares, formatWealth } from "@/lib/konglo-format";
import { OWNERSHIP_AS_OF, OWNERSHIP_SOURCE } from "@/lib/shareholders";

export async function generateMetadata({ params }: PageProps<"/konglo/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const profile = KONGLO_PROFILES.find((item) => item.slug === slug);
  return { title: `${profile?.name ?? "Konglo"} — IDX Terminal` };
}

export default async function KongloDetailPage({ params }: PageProps<"/konglo/[slug]">) {
  await requireUser();
  const { slug } = await params;
  const profile = KONGLO_PROFILES.find((item) => item.slug === slug);
  if (!profile) notFound();
  const holdings = kongloHoldings(profile);
  const summary = kongloPortfolioSummary(holdings);
  const chartItems = holdings.flatMap((item) => item.kind === "direct" && item.shares && item.price && item.indicativeValue
    ? [{ code: item.code, shares: item.shares, price: item.price, value: item.indicativeValue }] : []);

  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-4 sm:px-6">
      <Link href="/konglo" className="text-micro text-cyan hover:underline">← Semua tokoh</Link>
      <p className="mt-3 text-micro uppercase tracking-widest text-amber">Investor research {profile.rank ? `· Forbes #${profile.rank}` : "· tokoh tambahan"}</p>
      <h1 className="mt-1 font-display text-xl font-bold text-ink-hi">{profile.name}</h1>
      <p className="mt-2 max-w-4xl text-xs leading-relaxed text-dim">Kepemilikan langsung di atas 1% berasal dari snapshot KSEI/BEI {OWNERSHIP_AS_OF} atau laporan bertanggal lebih baru yang tercantum per saham. Keterkaitan melalui perusahaan dan keluarga tidak dianggap kepemilikan pribadi. Nilai saham adalah indikasi berdasarkan harga katalog, bukan kekayaan bersih.</p>
    </header>

    <div className="grid grid-cols-2 gap-px border-b border-rule bg-rule xl:grid-cols-4">
      <Metric label="Net worth · Forbes 2025" value={formatWealth(profile.netWorthUsd)} note={profile.wealthNote ?? (profile.netWorthUsd === undefined ? "Belum ada taksiran pribadi terverifikasi" : `Forbes · ${FORBES_LIST_DATE}`)} />
      <Metric label="Saham langsung tercatat" value={`${summary.directCount}`} note={`${summary.groupCount} keterkaitan grup, tidak dihitung`} />
      <Metric label="Jumlah lembar saham" value={summary.sharesKnownCount ? formatShares(summary.totalShares) : "N/D"} note={`${summary.sharesKnownCount} dari ${summary.directCount} posisi dengan jumlah tepat`} />
      <Metric label="Nilai saham indikatif" value={formatRupiahCompact(summary.indicativeValue)} note={`${summary.valuedCount} dari ${summary.directCount} posisi langsung berharga`} />
    </div>

    <div className="grid min-w-0 gap-px bg-rule lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.8fr)]">
      <section className="min-w-0 bg-panel">
        <h2 className="border-b border-rule bg-panel-hi px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber">Komposisi saham langsung</h2>
        <div className="p-4 sm:p-5"><PortfolioDonut items={chartItems} />
          <p className="mt-4 text-micro leading-relaxed text-dim">Irisan dihitung dari jumlah saham × harga penutupan katalog. Tanggal kepemilikan dan harga tercantum per emiten di bawah. Posisi tanpa jumlah lembar tepat tidak masuk grafik. Nilai berubah mengikuti harga dan kepemilikan. Ini bukan total kekayaan atau rekomendasi investasi.</p>
        </div>
      </section>
      <aside className="min-w-0 bg-panel">
        <h2 className="border-b border-rule bg-panel-hi px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber">Sumber & batas data</h2>
        <div className="space-y-3 p-4 text-xs leading-relaxed text-dim">
          <p>Forbes menilai kekayaan pribadi atau keluarga secara lebih luas; nilai saham BEI di halaman ini hanya posisi langsung &gt;1% yang terdeteksi pada snapshot. Kedua angka tidak dapat dijumlahkan.</p>
          <p>“N/D” berarti tidak tersedia dari sumber yang dipakai, bukan nol. Keterkaitan grup tidak masuk ke grafik atau total nilai pribadi.</p>
          <SourceLink href={FORBES_LIST_URL}>Forbes Indonesia 50 Richest · {FORBES_LIST_DATE}</SourceLink>
          <SourceLink href={OWNERSHIP_SOURCE}>KSEI / BEI · data kepemilikan saham</SourceLink>
          <SourceLink href={PRICE_SOURCE_URL}>KSEI · harga katalog emiten</SourceLink>
        </div>
      </aside>
    </div>

    <section className="min-w-0 border-t border-rule">
      <h2 className="border-b border-rule bg-panel-hi px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber">Emiten terkait</h2>
      {holdings.length ? <ol className="divide-y divide-rule/70">{holdings.map((item) => {
        const company = getCompanyCatalogEntry(item.code);
        return <li key={item.code} className="grid min-w-0 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><CompanyLogo code={item.code} logoUrl={company?.logoUrl ?? null} /><div className="min-w-0"><Link href={`/asset/${item.code}`} className="font-bold text-cyan hover:underline">{item.code} ↗</Link><p className="truncate text-xs text-dim" title={item.name}>{item.name}</p><p className="mt-1 text-micro text-dim">{item.kind === "direct" ? `Langsung · ${item.ownershipAsOf}` : "Keterkaitan grup / keluarga · bukan saham pribadi"}</p></div></div>
          <div className="min-w-0 text-xs sm:text-right"><p className="font-display font-bold tabular-nums text-ink-hi">{item.percentage === null ? "Persentase N/D" : `${item.percentage.toLocaleString("id-ID", { maximumFractionDigits: 4 })}% · ${item.shares === null ? "jumlah N/D" : `${formatShares(item.shares)} lembar`}`}</p><p className="mt-1 text-dim">{item.kind === "direct" ? `Harga Rp ${item.price === null ? "N/D" : formatShares(item.price)} · ${item.priceAsOf ?? "tanggal N/D"}` : "Jumlah dan nilai saham pribadi N/D"}</p><p className="mt-1 text-ink-hi">{item.kind === "direct" ? `Nilai indikatif ${formatRupiahCompact(item.indicativeValue)}` : ""}</p><SourceLink href={item.sourceUrl}>Sumber kepemilikan</SourceLink></div>
        </li>;
      })}</ol> : <p className="p-4 text-xs text-dim">Belum ada saham langsung &gt;1% atau keterkaitan grup yang dapat dipastikan dari sumber ini.</p>}
    </section>
  </main>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="min-w-0 bg-panel px-4 py-4"><p className="text-micro uppercase tracking-wider text-dim">{label}</p><strong className="mt-2 block font-display text-base tabular-nums text-ink-hi">{value}</strong><p className="mt-1 text-micro leading-relaxed text-dim">{note}</p></div>;
}

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-micro text-cyan hover:underline">{children}<ArrowUpRight className="h-3 w-3" aria-hidden="true" /></a>;
}
