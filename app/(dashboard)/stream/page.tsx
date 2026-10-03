import type { Metadata } from "next";
import Link from "next/link";
import { isGuest, requireUser } from "@/lib/auth/session";
import { COMPANY_CATALOG } from "@/lib/company-catalog";
import { listStreamPosts } from "@/lib/stream";
import { StreamComposer, StreamFeed } from "@/components/stream/StreamFeed";

export const metadata: Metadata = { title: "Stream — IDX Terminal" };
export const dynamic = "force-dynamic";
const stocks = COMPANY_CATALOG.map(({ code, name }) => ({ code, name }));

export default async function StreamPage() {
  const user = await requireUser();
  const feed = await listStreamPosts(user.id);
  return <main className="min-w-0 flex-1 bg-void px-3 py-5 sm:px-6 sm:py-7"><div className="mx-auto max-w-3xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-micro font-bold uppercase tracking-widest text-amber">IDX / komunitas</p><h1 className="mt-1 font-display text-2xl font-bold text-ink-hi">Stream</h1><p className="mt-1 text-xs text-dim">Bagikan status dan thesis saham. Pandangan pengguna bukan rekomendasi investasi.</p></div><Link href={`/stream/user/${encodeURIComponent(user.username)}`} className="min-h-10 border border-rule-hi px-3 py-2 text-xs font-bold text-cyan hover:border-amber">Profil Stream saya →</Link></header>
    <StreamComposer stocks={stocks} canPost={!isGuest(user)} />
    <StreamFeed initialPosts={feed.posts} initialCursor={feed.nextCursor} canInteract={!isGuest(user)} paginated />
  </div></main>;
}
