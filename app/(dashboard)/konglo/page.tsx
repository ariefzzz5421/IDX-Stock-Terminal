import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { FORBES_LIST_DATE, FORBES_LIST_URL, KONGLO_PROFILES, kongloHoldings } from "@/lib/konglo";
import { formatWealth } from "@/lib/konglo-format";

export const metadata: Metadata = { title: "Konglo — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function KongloPage() {
  await requireUser();

  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-4 sm:px-6">
      <p className="text-micro uppercase tracking-widest text-amber">Ownership map / investor research</p>
      <h1 className="mt-1 font-display text-xl font-bold text-ink-hi">Konglo</h1>
      <p className="mt-2 max-w-4xl text-xs leading-relaxed text-dim">Tokoh dan keluarga dengan keterkaitan emiten BEI. Nilai kekayaan yang tersedia berasal dari <a href={FORBES_LIST_URL} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Forbes Indonesia’s 50 Richest 2025 ↗</a> ({FORBES_LIST_DATE}); N/D berarti belum ada angka pribadi yang sebanding dan terverifikasi. Kepemilikan langsung memakai snapshot KSEI/BEI 27 Februari 2026. Keterkaitan grup ditampilkan terpisah.</p>
    </header>
    <ol className="divide-y divide-rule">
      {KONGLO_PROFILES.map((profile, index) => {
        const holdings = kongloHoldings(profile);
        const directCount = holdings.filter((holding) => holding.kind === "direct").length;
        return <li key={profile.slug}>
          <Link href={`/konglo/${profile.slug}`} className="flex min-w-0 items-start gap-3 px-4 py-4 transition-colors hover:bg-panel-hi sm:items-center sm:px-6">
            <span className="w-10 shrink-0 font-display text-sm font-bold tabular-nums text-amber">{index + 1}.</span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-sm font-bold text-ink-hi">{profile.name}</span>
              <span className="mt-1 block text-micro text-dim">{profile.rank ? `Forbes #${profile.rank} · ` : ""}{directCount} saham langsung &gt;1% · {holdings.length - directCount} keterkaitan grup</span>
              <span className="mt-2 flex flex-wrap gap-1">{holdings.map((holding) => <span key={holding.code} className="border border-rule-hi px-1.5 py-0.5 text-micro text-cyan">{holding.code} {holding.percentage === null ? "N/D" : `${holding.percentage.toLocaleString("id-ID", { maximumFractionDigits: 4 })}%`}</span>)}</span>
              <span className="mt-2 block text-micro text-dim sm:hidden">Net worth · <strong className="font-display text-ink-hi">{formatWealth(profile.netWorthUsd)}</strong></span>
            </span>
            <span className="hidden shrink-0 text-right sm:block"><span className="block text-micro uppercase tracking-wider text-dim">Net worth</span><strong className="mt-1 block font-display text-sm tabular-nums text-ink-hi">{formatWealth(profile.netWorthUsd)}</strong></span>
            <ArrowRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-amber sm:mt-0" />
          </Link>
        </li>;
      })}
    </ol>
  </main>;
}
