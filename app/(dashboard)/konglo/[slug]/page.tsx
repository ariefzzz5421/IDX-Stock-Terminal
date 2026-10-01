import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { FORBES_LIST_DATE, FORBES_LIST_URL, KONGLO_PROFILES, kongloHoldings } from "@/lib/konglo";
import { OWNERSHIP_AS_OF } from "@/lib/shareholders";

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
  return <main className="min-w-0 flex-1 bg-panel"><header className="border-b border-rule px-4 py-4 sm:px-6"><Link href="/konglo" className="text-micro text-cyan hover:underline">← Semua tokoh</Link><p className="mt-3 text-micro uppercase tracking-widest text-amber">Forbes 50 Indonesia 2025 · peringkat #{profile.rank}</p><h1 className="mt-1 font-display text-xl font-bold text-ink-hi">{profile.name}</h1><p className="mt-2 max-w-3xl text-xs leading-relaxed text-dim">Persentase di bawah hanya kepemilikan langsung atas nama yang cocok di data KSEI/BEI per {OWNERSHIP_AS_OF}. Kepemilikan melalui badan usaha, keluarga, atau pihak lain tidak disamakan dengan saham pribadi.</p></header><div className="grid gap-px bg-rule lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]"><section className="min-w-0 bg-panel"><h2 className="border-b border-rule bg-panel-hi px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber">Saham terkait</h2>{holdings.length ? <ol>{holdings.map((holding) => { const company = getCompanyCatalogEntry(holding.code); return <li key={holding.code} className="border-b border-rule/70 p-4"><div className="flex min-w-0 items-center gap-3"><CompanyLogo code={holding.code} logoUrl={company?.logoUrl ?? null} /><div className="min-w-0 flex-1"><Link href={`/asset/${holding.code}`} className="font-bold text-cyan hover:underline">{holding.code} ↗</Link><p className="truncate text-xs text-dim" title={holding.name}>{holding.name}</p></div><span className="shrink-0 font-display text-sm font-bold tabular-nums text-ink-hi">{holding.percentage === null ? "N/D" : `${holding.percentage.toLocaleString("id-ID", { maximumFractionDigits: 4 })}%`}</span></div><p className="mt-2 text-micro text-dim">{holding.kind === "direct" ? `Kepemilikan langsung >1% · KSEI/BEI ${OWNERSHIP_AS_OF}` : "Keterkaitan grup/keluarga · persentase pribadi tidak terverifikasi"}</p><a href={holding.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-micro text-cyan hover:underline">Lihat sumber <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></a></li>; })}</ol> : <p className="p-4 text-xs text-dim">Belum ada kepemilikan langsung &gt;1% yang cocok pada snapshot ini.</p>}</section><aside className="bg-panel p-4"><h2 className="text-xs font-bold uppercase tracking-wider text-amber">Cara membaca data</h2><p className="mt-3 text-xs leading-relaxed text-dim">Peringkat kekayaan dan nama keluarga berasal dari Forbes. Daftar saham langsung disaring dari pemegang saham di atas 1% pada snapshot KSEI/BEI. “N/D” berarti persentase pribadi tidak tersedia dari sumber yang digunakan, bukan nol saham.</p><a href={FORBES_LIST_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs text-cyan hover:underline">Daftar Forbes · {FORBES_LIST_DATE} <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></a></aside></div></main>;
}
