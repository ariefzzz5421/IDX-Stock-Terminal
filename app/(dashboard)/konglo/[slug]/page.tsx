import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";
import { PortfolioDonut } from "@/components/konglo/PortfolioDonut";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { FORBES_LIST_DATE, FORBES_LIST_URL, KONGLO_PROFILES, kongloHoldings, kongloPortfolioSummary } from "@/lib/konglo";
import { formatRupiahCompact, formatShares, formatWealth } from "@/lib/konglo-format";
import { KongloPortrait } from "@/components/konglo/KongloPortrait";
import { KONGLO_PHOTOS } from "@/lib/konglo-photos";

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
  const chartItems = holdings.flatMap((item) => item.percentage !== null && item.indicativeValue !== null
    ? [{ code: item.code, shares: item.shares, percentage: item.percentage, value: item.indicativeValue, kind: item.kind, holder: item.holder }] : []);
  const isForbes = profile.netWorthUsd !== undefined;
  const groupOnly = !isForbes && summary.indicativeValue === null && summary.groupValue !== null;

  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-4 sm:px-6">
      <Link href="/konglo" className="text-micro text-cyan hover:underline">← Semua tokoh</Link>
      <p className="mt-3 text-micro uppercase tracking-widest text-amber">Investor research {profile.rank ? `· Forbes #${profile.rank}` : "· tokoh tambahan"}</p>
      <div className="mt-2 flex items-center gap-3"><KongloPortrait slug={profile.slug} name={profile.name} size={64} /><h1 className="min-w-0 font-display text-xl font-bold text-ink-hi">{profile.name}</h1></div>
      {KONGLO_PHOTOS[profile.slug] && <a href={KONGLO_PHOTOS[profile.slug].sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-micro text-dim hover:text-cyan">Foto: {KONGLO_PHOTOS[profile.slug].credit} ↗</a>}
      <p className="mt-2 max-w-4xl text-xs leading-relaxed text-dim">Peta saham BEI yang tercatat atas nama pribadi dan entitas terkait. Persentase saham dikalikan kapitalisasi pasar dalam katalog. Nilai entitas ditampilkan terpisah; saham anak dan induk dalam satu rantai dapat tumpang tindih, sehingga jumlahnya bukan kekayaan ekonomis pribadi.</p>
      <a href={FORBES_LIST_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-micro text-cyan hover:underline">Forbes Indonesia 50 Richest · {FORBES_LIST_DATE} <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></a>
    </header>

    <div className="grid grid-cols-2 gap-px border-b border-rule bg-rule xl:grid-cols-4">
      <Metric label={isForbes ? "Net worth · Forbes 2025" : groupOnly ? "Est. nilai saham grup" : "Est. net worth · saham BEI"} value={isForbes ? formatWealth(profile.netWorthUsd) : formatRupiahCompact(groupOnly ? summary.groupValue : summary.indicativeValue)} note={profile.wealthNote ?? (isForbes ? `Forbes · ${FORBES_LIST_DATE}` : groupOnly ? "Nilai saham entitas terkait; bagian pribadi keluarga belum terverifikasi" : "Batas bawah dari saham pribadi yang terverifikasi; bukan seluruh harta bersih")} />
      <Metric label="Nilai saham pribadi" value={formatRupiahCompact(summary.indicativeValue)} note={`${summary.valuedCount} posisi langsung · ${summary.directCount} saham teridentifikasi`} />
      <Metric label="Nilai saham entitas" value={formatRupiahCompact(summary.groupValue)} note={`${summary.groupValuedCount} posisi grup bernilai; bukan milik pribadi sepenuhnya`} />
      <Metric label="Lembar pribadi tercatat" value={summary.sharesKnownCount ? formatShares(summary.totalShares) : "N/D"} note={`${summary.sharesKnownCount} dari ${summary.directCount} posisi dengan jumlah tepat`} />
    </div>

    <div className="min-w-0 bg-panel">
      <section className="min-w-0">
        <h2 className="border-b border-rule bg-panel-hi px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber">Komposisi aset saham terpetakan</h2>
        <div className="p-4 sm:p-5"><PortfolioDonut items={chartItems} /></div>
      </section>
    </div>

    {profile.pendingExposure?.length ? <section className="border-t border-rule">
      <h2 className="border-b border-rule bg-panel-hi px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber">Transaksi diumumkan · belum selesai</h2>
      <ul className="divide-y divide-rule">{profile.pendingExposure.map((item) => <li key={item.code} className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs sm:px-6"><Link href={`/asset/${item.code}`} className="font-bold text-cyan hover:underline">{item.code}</Link><span className="text-ink-hi">{item.holder} · rencana {item.percentage}%</span><span className="text-dim">{item.note} Diumumkan {item.announcedOn}; tidak masuk total portofolio.</span><SourceLink href={item.sourceUrl}>Keterbukaan transaksi</SourceLink></li>)}</ul>
    </section> : null}

    <section className="min-w-0 border-t border-rule">
      <h2 className="border-b border-rule bg-panel-hi px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber">Emiten terkait</h2>
      {holdings.length ? <ol className="divide-y divide-rule/70">{holdings.map((item) => {
        const company = getCompanyCatalogEntry(item.code);
        return <li key={`${item.kind}-${item.code}`} className="grid min-w-0 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><CompanyLogo code={item.code} logoUrl={company?.logoUrl ?? null} /><div className="min-w-0"><Link href={`/asset/${item.code}`} className="font-bold text-cyan hover:underline">{item.code} ↗</Link><p className="truncate text-xs text-dim" title={item.name}>{item.name}</p><p className="mt-1 text-micro text-dim">{item.kind === "direct" ? "Saham pribadi" : "Saham entitas / deemed interest"} · {item.holder} · {item.ownershipAsOf ?? "tanggal N/D"}</p></div></div>
          <div className="min-w-0 text-xs sm:text-right"><p className="font-display font-bold tabular-nums text-ink-hi">{item.percentage === null ? "Persentase N/D" : `${item.percentage.toLocaleString("id-ID", { maximumFractionDigits: 4 })}% · ${item.shares === null ? "jumlah N/D" : `${formatShares(item.shares)} lembar`}`}</p><p className="mt-1 text-dim">Kap. pasar {formatRupiahCompact(item.marketCap)}</p><p className="mt-1 text-ink-hi">Nilai saham {formatRupiahCompact(item.indicativeValue)}</p><SourceLink href={item.sourceUrl}>{item.snapshotSourceUrl ? "Sumber keterkaitan" : "Sumber kepemilikan"}</SourceLink>{item.snapshotSourceUrl && <span className="ml-3"><SourceLink href={item.snapshotSourceUrl}>Snapshot KSEI/BEI</SourceLink></span>}</div>
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
