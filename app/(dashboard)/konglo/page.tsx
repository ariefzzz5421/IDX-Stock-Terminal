import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { FORBES_LIST_DATE, FORBES_LIST_URL, KONGLO_PROFILES, kongloHoldings } from "@/lib/konglo";

export const metadata: Metadata = { title: "Konglo — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function KongloPage() {
  await requireUser();
  return <main className="min-w-0 flex-1 bg-panel"><header className="border-b border-rule px-4 py-4 sm:px-6"><p className="text-micro uppercase tracking-widest text-amber">Peta kepemilikan / riset investor</p><h1 className="mt-1 font-display text-xl font-bold text-ink-hi">Konglo</h1><p className="mt-2 max-w-3xl text-xs leading-relaxed text-dim">Tokoh dan keluarga pilihan dari <a href={FORBES_LIST_URL} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Forbes Indonesia’s 50 Richest 2025 ↗</a> ({FORBES_LIST_DATE}). Peringkat berasal dari Forbes; persentase saham langsung berasal dari snapshot KSEI/BEI 27 Februari 2026. Keterkaitan melalui grup diberi label terpisah dan persentasenya N/D.</p></header><div className="grid gap-px bg-rule md:grid-cols-2 xl:grid-cols-3">{KONGLO_PROFILES.map((profile) => { const holdings = kongloHoldings(profile); return <Link key={profile.slug} href={`/konglo/${profile.slug}`} className="min-w-0 bg-panel p-4 transition-colors hover:bg-panel-hi"><div className="flex items-start gap-3"><span className="text-sm font-bold tabular-nums text-amber">#{profile.rank}</span><div className="min-w-0 flex-1"><h2 className="font-display text-sm font-bold text-ink-hi">{profile.name}</h2><p className="mt-1 text-micro text-dim">{holdings.filter((holding) => holding.kind === "direct").length} saham langsung &gt;1% · {holdings.filter((holding) => holding.kind === "group").length} eksposur grup</p></div></div><div className="mt-4 flex flex-wrap gap-1">{holdings.map((holding) => <span key={holding.code} className="border border-rule-hi px-1.5 py-1 text-micro text-cyan">{holding.code} {holding.percentage === null ? "N/D" : `${holding.percentage.toLocaleString("id-ID", { maximumFractionDigits: 4 })}%`}</span>)}</div><span className="mt-4 block text-micro text-amber">Lihat kepemilikan →</span></Link>; })}</div></main>;
}
