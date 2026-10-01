import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { COMPANY_CATALOG } from "@/lib/company-catalog";
import { SECTOR_GROUPS } from "@/lib/sector-catalog";
import { getMarketActivity } from "@/lib/market-data/trending";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";
import { formatPrice, formatValue } from "@/lib/format";

export const metadata: Metadata = { title: "Sector — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function SectorPage() {
  await requireUser();
  const activity = await getMarketActivity();
  const market = new Map(activity.allStocks.map((stock) => [stock.code, stock]));
  const catalog = new Map(COMPANY_CATALOG.map((company) => [company.code, company]));
  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-4 sm:px-6"><p className="text-micro uppercase tracking-widest text-amber">IDX / thematic research</p><h1 className="mt-1 font-display text-xl font-bold text-ink-hi">Sector</h1><p className="mt-1 max-w-3xl text-xs leading-relaxed text-dim">Each sector is a vertical market-cap ranking. TradingView figures are delayed where available; other values come from the dated company catalogue. Theme exposure does not mean all revenue comes from that theme.</p></header>
    <nav aria-label="Jump to sector" className="flex gap-1 overflow-x-auto border-b border-rule px-4 py-2 sm:px-6">{SECTOR_GROUPS.map((sector) => <a key={sector.id} href={`#${sector.id}`} className="shrink-0 border border-rule-hi px-3 py-2 text-xs text-ink hover:border-amber hover:text-amber">{sector.title}</a>)}</nav>
    <div className="divide-y divide-rule">{SECTOR_GROUPS.map((sector) => {
      const codes = sector.id === "bank" ? COMPANY_CATALOG.filter((company) => /^(Major|Regional) Banks$/.test(company.industry ?? "")).map((company) => company.code) : sector.tickers;
      const companies = codes.flatMap((code) => { const company = catalog.get(code); return company ? [{ company, market: market.get(code) }] : []; }).sort((a, b) => (b.market?.marketCap ?? b.company.marketCap ?? -1) - (a.market?.marketCap ?? a.company.marketCap ?? -1));
      return <section id={sector.id} key={sector.id} className="min-w-0 scroll-mt-4 bg-panel"><div className="border-b border-rule bg-panel-hi px-4 py-3 sm:px-6"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-sm font-bold text-amber">{sector.title}</h2><span className="text-micro text-dim">{companies.length} stocks</span></div><p className="mt-1 text-xs leading-relaxed text-dim">{sector.summary}</p></div><ol>{companies.map(({ company, market }, index) => <li key={company.code} className="border-b border-rule/60 last:border-0"><Link href={`/asset/${company.code}`} className="flex min-w-0 items-center gap-3 px-4 py-2.5 hover:bg-panel-hi sm:px-6"><span className="w-7 shrink-0 text-xs tabular-nums text-amber">{index + 1}.</span><CompanyLogo code={company.code} logoUrl={company.logoUrl} /><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-ink-hi">{company.code}</span><span className="block truncate text-micro text-dim" title={company.name}>{company.name}</span></span><span className="shrink-0 text-right"><span className="block text-xs font-semibold tabular-nums text-ink-hi">{formatValue(market?.marketCap ?? company.marketCap)}</span><span className="block text-micro tabular-nums text-dim">{market?.lastPrice == null ? "Price N/D" : `Rp ${formatPrice(market.lastPrice)}`}</span></span></Link></li>)}</ol><a href={sector.sourceUrl} target={sector.sourceUrl.startsWith("http") ? "_blank" : undefined} rel={sector.sourceUrl.startsWith("http") ? "noopener noreferrer" : undefined} className="inline-flex items-center gap-1 px-4 py-3 text-micro text-cyan hover:underline sm:px-6">Source: {sector.sourceName} <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></a></section>;
    })}</div>
  </main>;
}
