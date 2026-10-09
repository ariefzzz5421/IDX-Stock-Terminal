import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Search, UsersRound } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { KONGLO_PROFILES, kongloHoldings } from "@/lib/konglo";
import { OWNERSHIP_ROWS, OWNERSHIP_TICKERS, findOwnership, ownershipOverview } from "@/lib/ownership-overview";
import { OWNERSHIP_AS_OF, OWNERSHIP_DOCUMENT, OWNERSHIP_SOURCE, codesForNamedShareholder } from "@/lib/shareholders";

export const metadata: Metadata = { title: "Ownership Overview — IDX Terminal" };
export const dynamic = "force-dynamic";

const people = [
  { name: "Garibaldi Thohir", holder: "GARIBALDI THOHIR", slug: "garibaldi-thohir" },
  { name: "Sandiaga Salahuddin Uno", holder: "SANDIAGA SALAHUDDIN UNO" },
  { name: "Hary Tanoesoedibjo", holder: "HARY TANOESOEDIBJO", slug: "hary-tanoesoedibjo" },
  { name: "Anthoni Salim", holder: "ANTHONI SALIM", slug: "anthoni-salim" },
  { name: "Lo Kheng Hong", holder: "LO KHENG HONG" },
  { name: "Achmad Zaky", holder: "ACHMAD ZAKY SYAIFUDIN" },
];

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser();
  const query = (await searchParams).q?.trim() ?? "";
  const results = query ? findOwnership(query) : [];
  const overview = ownershipOverview();
  const groups = KONGLO_PROFILES.map((profile) => ({ profile, count: new Set(kongloHoldings(profile).map((item) => item.code)).size })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 12);

  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <p className="text-micro uppercase tracking-[0.18em] text-amber">KSEI / Ownership intelligence</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink-hi">Overview</h1>
      <p className="mt-2 max-w-4xl text-xs leading-relaxed text-dim">Peta pemegang saham ≥1% emiten BEI berdasarkan laporan BEI/KSEI per {OWNERSHIP_AS_OF}. Nama yang sama pada dua saham menunjukkan posisi tercatat, bukan otomatis satu grup pengendali.</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"><a href={OWNERSHIP_SOURCE} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Sumber BEI / KSEI ↗</a><a href={OWNERSHIP_DOCUMENT} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Laporan XLSX resmi ↗</a></div>
      <form action="/overview" className="mt-5 flex w-full max-w-2xl items-stretch border border-rule-hi bg-void focus-within:border-amber">
        <Search aria-hidden="true" className="m-3 h-4 w-4 shrink-0 text-amber" />
        <input type="search" name="q" defaultValue={query} maxLength={80} placeholder="Cari kode saham atau nama pemegang saham" aria-label="Cari kode saham atau pemegang saham" className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink-hi outline-none placeholder:text-dim" />
        <button type="submit" className="shrink-0 border-l border-rule-hi px-4 text-xs font-bold uppercase text-amber hover:bg-panel-hi">Cari</button>
      </form>
    </header>

    {query ? <section aria-label="Hasil pencarian" className="border-b border-rule">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-panel-hi px-4 py-3 sm:px-6"><h2 className="text-xs font-bold uppercase tracking-widest text-amber">Hasil untuk “{query}”</h2><Link href="/overview" className="text-xs text-cyan hover:underline">Hapus pencarian</Link></div>
      {results.length ? <ol className="grid divide-y divide-rule lg:grid-cols-2 lg:divide-y-0">{results.map((item) => <li key={item.code} className="border-b border-rule lg:odd:border-r"><Link href={`/overview/${item.code}`} className="flex min-w-0 items-center gap-3 px-4 py-3 hover:bg-panel-hi sm:px-6"><strong className="w-16 shrink-0 text-sm text-amber">{item.code}</strong><span className="min-w-0 flex-1"><span className="block truncate text-xs text-ink-hi">{getCompanyCatalogEntry(item.code)?.name ?? (item.code === "CNTX" ? "CENTEX Tbk Seri A Preferen" : item.code)}</span><span className="block truncate text-micro text-dim">{item.matchingHolders.join(" · ") || `${item.count} posisi tercatat`}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-amber" /></Link></li>)}</ol> : <p className="px-4 py-5 text-xs text-dim sm:px-6">Tidak ada posisi yang cocok dalam snapshot ini.</p>}
    </section> : null}

    <section aria-label="Cakupan data" className="grid grid-cols-2 border-b border-rule bg-panel-hi sm:grid-cols-4">
      {[["Ticker", OWNERSHIP_TICKERS], ["Posisi ≥1%", OWNERSHIP_ROWS], ["Nama investor unik", overview.investorCount], ["Tanggal snapshot", OWNERSHIP_AS_OF]].map(([label, value]) => <div key={label} className="min-w-0 border-b border-r border-rule px-4 py-4 sm:border-b-0 sm:px-6"><span className="block text-micro uppercase tracking-wider text-dim">{label}</span><strong className="mt-1 block break-words font-display text-lg text-ink-hi">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</strong></div>)}
    </section>

    <div className="grid min-w-0 lg:grid-cols-2 xl:grid-cols-4">
      <section className="min-w-0 border-b border-rule xl:border-r"><h2 className="border-b border-rule bg-panel-hi px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber">By Investor Type</h2><ol>{overview.types.map((item) => <li key={item.type} className="flex items-center gap-2 border-b border-rule/60 px-4 py-2 text-xs last:border-0"><span className="w-8 shrink-0 border border-rule-hi py-1 text-center text-[10px] text-cyan">{item.type.slice(0, 2).toUpperCase() || "?"}</span><span className="min-w-0 flex-1 truncate">{item.name}</span><strong className="tabular-nums text-ink-hi">{item.count.toLocaleString("id-ID")}</strong><span className="w-11 text-right text-dim">{item.percentage.toFixed(1)}%</span></li>)}</ol></section>
      <section className="min-w-0 border-b border-rule lg:border-l xl:border-l-0 xl:border-r"><h2 className="border-b border-rule bg-panel-hi px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber">Most Disclosed Holders</h2><ol>{overview.busiest.map((item, index) => <li key={item.code}><Link href={`/overview/${item.code}`} className="flex items-center gap-3 border-b border-rule/60 px-4 py-2 text-xs hover:bg-panel-hi"><span className="w-5 text-dim">{index + 1}</span><strong className="w-14 text-cyan">{item.code}</strong><span className="min-w-0 flex-1 truncate text-dim">{getCompanyCatalogEntry(item.code)?.name}</span><span className="text-amber">{item.count}</span></Link></li>)}</ol></section>
      <section className="min-w-0 border-b border-rule xl:border-r"><h2 className="border-b border-rule bg-panel-hi px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber">Cross-Held Names</h2><ol>{overview.crossHolders.map((item, index) => <li key={item.name} className="flex items-start gap-2 border-b border-rule/60 px-4 py-2 text-xs"><span className="w-5 shrink-0 text-dim">{index + 1}</span><span className="min-w-0 flex-1 break-words text-ink">{item.name}</span><span className="shrink-0 text-amber">{item.count} stocks</span></li>)}</ol><p className="px-4 py-3 text-micro leading-relaxed text-dim">Nama kustodian atau sekuritas bukan selalu pemilik manfaat akhir.</p></section>
      <section className="min-w-0 border-b border-rule lg:border-l xl:border-l-0"><h2 className="border-b border-rule bg-panel-hi px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber"><Building2 className="mr-2 inline h-4 w-4" />Conglomerates</h2><ol>{groups.map(({ profile, count }) => <li key={profile.slug}><Link href={`/konglo/${profile.slug}`} className="flex min-w-0 items-center gap-2 border-b border-rule/60 px-4 py-2 text-xs hover:bg-panel-hi"><span className="min-w-0 flex-1 truncate">{profile.name}</span><span className="shrink-0 text-amber">{count} stocks</span><ArrowRight className="h-3 w-3 shrink-0 text-dim" /></Link></li>)}</ol></section>
    </div>

    <section className="border-b border-rule"><h2 className="border-b border-rule bg-panel-hi px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber"><UsersRound className="mr-2 inline h-4 w-4" />Public Figures / Investors</h2><div className="grid sm:grid-cols-2 xl:grid-cols-3">{people.map((person) => { const codes = codesForNamedShareholder(person.holder); return <div key={person.name} className="min-w-0 border-b border-r border-rule px-4 py-3"><div className="flex items-center justify-between gap-3"><strong className="min-w-0 text-xs text-ink-hi">{person.name}</strong><span className="shrink-0 text-micro text-amber">{codes.length} pos</span></div><p className="mt-1 text-micro text-dim">{codes.length ? codes.map((code) => <Link key={code} href={`/overview/${code}`} className="mr-2 text-cyan hover:underline">{code}</Link>) : "Tidak terdeteksi atas nama persis dalam snapshot ini"}</p>{person.slug && <Link href={`/konglo/${person.slug}`} className="mt-2 inline-block text-micro text-cyan hover:underline">Lihat profil ↗</Link>}</div>; })}</div></section>
  </main>;
}
