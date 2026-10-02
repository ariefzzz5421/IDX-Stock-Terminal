import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { formatVolume } from "@/lib/format";
import { sharedHolderLinks } from "@/lib/ownership-overview";
import { OWNERSHIP_AS_OF, OWNERSHIP_SOURCE, shareholdersFor } from "@/lib/shareholders";
import { HoldingPieChart } from "@/components/terminal/HoldingPieChart";
import { OwnershipNetwork } from "@/components/terminal/OwnershipNetwork";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }): Promise<Metadata> {
  const { ticker } = await params;
  return { title: `${ticker.toUpperCase()} Ownership — IDX Terminal` };
}

export default async function OwnershipDetail({ params }: { params: Promise<{ ticker: string }> }) {
  await requireUser();
  const { ticker } = await params;
  const code = ticker.toUpperCase();
  if (!/^[A-Z0-9]{4,5}$/.test(code)) notFound();
  const company = getCompanyCatalogEntry(code);
  const holders = shareholdersFor(code);
  if (!company || !holders.length) notFound();
  const related = sharedHolderLinks(code);
  const disclosed = holders.reduce((sum, holder) => sum + holder.percentage, 0);
  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-5 sm:px-6"><Link href="/overview" className="text-xs text-cyan hover:underline">← Overview</Link><p className="mt-4 text-micro uppercase tracking-widest text-amber">Ownership / {OWNERSHIP_AS_OF}</p><h1 className="mt-1 font-display text-2xl font-bold text-ink-hi">{code}</h1><p className="mt-1 text-sm text-dim">{company.name}</p><Link href={`/asset/${code}`} className="mt-3 inline-block text-xs text-cyan hover:underline">Lihat harga dan profil emiten ↗</Link></header>
    <div className="grid grid-cols-2 border-b border-rule bg-panel-hi sm:grid-cols-3">{[["Pemegang >1%", holders.length.toLocaleString("id-ID")], ["Total posisi terungkap", `${disclosed.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`], ["Saham dengan nama pemegang sama", related.length.toLocaleString("id-ID")]].map(([label, value]) => <div key={label} className="border-b border-r border-rule px-4 py-3 sm:border-b-0"><span className="block text-micro uppercase tracking-wider text-dim">{label}</span><strong className="mt-1 block text-base text-ink-hi">{value}</strong></div>)}</div>
    <div className="grid min-w-0 xl:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]"><section className="min-w-0 border-b border-rule xl:border-r"><h2 className="border-b border-rule bg-panel-hi px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber">Shareholders</h2><div className="overflow-x-auto"><table className="w-full min-w-[36rem] text-left text-xs"><thead><tr className="border-b border-rule text-micro uppercase text-dim"><th className="px-4 py-2">Investor</th><th className="px-2 py-2">Type</th><th className="px-2 py-2 text-right">Shares</th><th className="px-4 py-2 text-right">%</th></tr></thead><tbody>{holders.map((holder) => <tr key={holder.name} className="border-b border-rule/60"><td className="px-4 py-2 text-ink-hi">{holder.name}{holder.affiliation && <a href={holder.affiliation.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-micro text-amber hover:underline">{holder.affiliation.label} ↗</a>}</td><td className="px-2 py-2 text-dim">{holder.investorType || "—"}</td><td className="px-2 py-2 text-right tabular-nums">{formatVolume(holder.shares)}</td><td className="px-4 py-2 text-right tabular-nums text-amber">{holder.percentage.toLocaleString("id-ID", { maximumFractionDigits: 4 })}%</td></tr>)}</tbody></table></div></section><section className="min-w-0 border-b border-rule p-4"><h2 className="text-xs font-bold uppercase tracking-wider text-amber">Distribution</h2><HoldingPieChart holders={holders} /></section></div>
    <section className="min-w-0 p-4 sm:p-6"><OwnershipNetwork code={code} holders={holders} related={related} /><p className="mt-3 text-micro text-dim">Snapshot {OWNERSHIP_AS_OF} · <a href={OWNERSHIP_SOURCE} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">BEI / KSEI ↗</a>. Porsi “lainnya” pada chart adalah selisih aritmetika; bukan data per investor.</p></section>
  </main>;
}
