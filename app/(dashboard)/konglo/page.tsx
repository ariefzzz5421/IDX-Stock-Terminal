import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { FORBES_LIST_DATE, FORBES_LIST_URL, KONGLO_PROFILES, kongloHoldings, kongloPortfolioSummary } from "@/lib/konglo";
import { formatRupiahCompact, formatWealth, formatWealthRupiahEstimate } from "@/lib/konglo-format";
import { KongloPortrait } from "@/components/konglo/KongloPortrait";

export const metadata: Metadata = { title: "Konglo — IDX Terminal" };
export const dynamic = "force-dynamic";
const HIGHLIGHT_SLUGS = ["haji-isam", "prajogo-pangestu", "bakrie", "garibaldi-thohir", "anthoni-salim"] as const;

export default async function KongloPage() {
  await requireUser();
  const holdingsBySlug = new Map(KONGLO_PROFILES.map((profile) => [profile.slug, kongloHoldings(profile)]));

  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-4 sm:px-6">
      <p className="text-micro uppercase tracking-widest text-amber">Ownership map / investor research</p>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="mt-1 font-display text-xl font-bold text-ink-hi">Konglo</h1><Link href="/konglo/feed" className="inline-flex min-h-9 items-center gap-2 border border-amber-dim px-3 text-xs font-bold text-amber hover:bg-amber/10"><Newspaper aria-hidden="true" className="h-4 w-4" />Konglo Feed <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link></div>
      <a href={FORBES_LIST_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-micro text-cyan hover:underline">Forbes Indonesia 50 Richest · {FORBES_LIST_DATE} ↗</a>
    </header>
    <section aria-labelledby="konglo-highlights" className="border-b border-rule bg-panel-hi px-4 py-4 sm:px-6">
      <h2 id="konglo-highlights" className="text-micro font-bold uppercase tracking-widest text-amber">Sorotan konglomerasi</h2>
      <div className="konglo-tape market-tape-window mt-3" aria-label="Sorotan konglomerasi bergerak">
        <div className="konglo-tape-track market-tape-track">{[0, 1].map((copy) => <div key={copy} className="market-tape-group" aria-hidden={copy === 1 ? true : undefined}>{HIGHLIGHT_SLUGS.map((slug) => {
        const profile = KONGLO_PROFILES.find((item) => item.slug === slug);
        if (!profile) return null;
        const holdings = holdingsBySlug.get(slug) ?? [];
        const summary = kongloPortfolioSummary(holdings);
        return <Link key={slug} tabIndex={copy === 1 ? -1 : undefined} href={`/konglo/${slug}`} className="group flex min-w-0 flex-col border border-rule bg-panel p-3 transition-colors hover:border-amber-dim hover:bg-panel-hi">
          <span className="flex min-w-0 items-center gap-3"><KongloPortrait slug={slug} name={profile.name} /><span className="min-w-0 flex-1"><strong className="block truncate font-display text-sm text-ink-hi">{profile.name}</strong><span className="mt-1 block text-micro text-dim">{holdings.length} emiten terkait · {profile.rank ? `Forbes #${profile.rank}` : "nilai Forbes N/D"}</span></span><ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-amber" /></span>
          <span className="mt-3 flex flex-wrap gap-1">{holdings.map((item) => <span key={`${item.kind}-${item.code}`} className="border border-rule-hi px-1.5 py-0.5 text-micro text-cyan">{item.code}</span>)}{profile.pendingExposure?.map((item) => <span key={`pending-${item.code}`} className="border border-amber/50 px-1.5 py-0.5 text-micro text-amber">{item.code} · rencana</span>)}</span>
          {profile.netWorthUsd !== undefined && <span className="mt-3 block font-display text-sm text-ink-hi">{formatWealth(profile.netWorthUsd)} <span className="ml-2 text-micro text-dim">{formatWealthRupiahEstimate(profile.netWorthUsd)}</span></span>}
          {profile.netWorthUsd === undefined && <span className="mt-3 block text-micro leading-relaxed text-dim">{summary.indicativeValue !== null && <span className="block">Saham langsung · <strong className="font-display text-sm text-ink-hi">{formatRupiahCompact(summary.indicativeValue)}</strong></span>}{summary.groupValue !== null && <span className="block">Saham entitas terkait · <strong className="font-display text-sm text-cyan">{formatRupiahCompact(summary.groupValue)}</strong></span>}<span className="block">Indikatif · posisi KSEI 30 Sep 2026 · bukan net worth</span></span>}
        </Link>;
      })}</div>)}</div>
      </div>
    </section>
    <ol className="divide-y divide-rule">
      {KONGLO_PROFILES.map((profile, index) => {
        const holdings = holdingsBySlug.get(profile.slug) ?? [];
        const summary = kongloPortfolioSummary(holdings);
        const directCount = holdings.filter((holding) => holding.kind === "direct").length;
        const groupOnly = profile.netWorthUsd === undefined && summary.indicativeValue === null && summary.groupValue !== null;
        const wealth = profile.netWorthUsd === undefined ? formatRupiahCompact(groupOnly ? summary.groupValue : summary.indicativeValue) : formatWealth(profile.netWorthUsd);
        const wealthLabel = profile.netWorthUsd !== undefined ? "Forbes net worth" : groupOnly ? "Est. saham entitas" : "Est. saham langsung";
        return <li key={profile.slug}>
          <Link href={`/konglo/${profile.slug}`} className="flex min-w-0 items-start gap-3 px-4 py-4 transition-colors hover:bg-panel-hi sm:items-center sm:px-6">
            <span className="w-10 shrink-0 font-display text-sm font-bold tabular-nums text-amber">{index + 1}.</span>
            <KongloPortrait slug={profile.slug} name={profile.name} />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-sm font-bold text-ink-hi">{profile.name}</span>
              <span className="mt-1 block text-micro text-dim">{profile.rank ? `Forbes #${profile.rank} · ` : ""}{holdings.length ? `${directCount} posisi saham langsung · ${holdings.length - directCount} keterkaitan lain` : "Kepemilikan saham BEI belum terpetakan dari sumber yang tersedia"}</span>
              <span className="mt-2 flex flex-wrap gap-1">{holdings.map((holding) => <span key={`${holding.kind}-${holding.code}`} className="border border-rule-hi px-1.5 py-0.5 text-micro text-cyan">{holding.code} {holding.percentage === null ? "N/D" : `${holding.percentage.toLocaleString("id-ID", { maximumFractionDigits: 4 })}%`}</span>)}{profile.pendingExposure?.map((item) => <span key={`pending-${item.code}`} className="border border-amber/50 px-1.5 py-0.5 text-micro text-amber">{item.code} · rencana</span>)}</span>
              <span className="mt-2 block text-micro text-dim sm:hidden">{wealthLabel} · <strong className="font-display text-ink-hi">{wealth}</strong>{profile.netWorthUsd !== undefined && <span className="ml-2 text-ink">{formatWealthRupiahEstimate(profile.netWorthUsd)}</span>}{summary.groupValue !== null && !groupOnly && <span className="block">Entitas {formatRupiahCompact(summary.groupValue)}</span>}</span>
            </span>
            <span className="hidden shrink-0 text-right sm:block"><span className="block text-micro uppercase tracking-wider text-dim">{wealthLabel}</span><strong className="mt-1 block font-display text-sm tabular-nums text-ink-hi">{wealth}</strong>{profile.netWorthUsd !== undefined && <span className="mt-1 block font-display text-xs tabular-nums text-cyan">{formatWealthRupiahEstimate(profile.netWorthUsd)}</span>}{summary.groupValue !== null && <span className="mt-1 block text-micro text-dim">Entitas {formatRupiahCompact(summary.groupValue)}</span>}</span>
            <ArrowRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-amber sm:mt-0" />
          </Link>
        </li>;
      })}
    </ol>
  </main>;
}
