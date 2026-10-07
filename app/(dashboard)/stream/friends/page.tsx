import type { Metadata } from "next";
import { isGuest, requireUser } from "@/lib/auth/session";
import { listFriends } from "@/lib/stream-friends";
import { FriendsDirectory } from "@/components/stream/FriendsDirectory";
import { StreamTabs } from "@/components/stream/StreamTabs";

export const metadata: Metadata = { title: "Friends — Stream IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const viewer = await requireUser();
  const initial = await listFriends(viewer.id);
  return <main className="min-w-0 flex-1 bg-void px-3 py-5 sm:px-6 sm:py-7"><div className="mx-auto max-w-3xl space-y-5">
    <header><p className="text-micro font-bold uppercase tracking-widest text-amber">IDX / komunitas</p><h1 className="mt-1 font-display text-2xl font-bold text-ink-hi">Friends</h1><p className="mt-1 text-xs text-dim">Temukan akun terdaftar, kirim permintaan, lalu tag teman dengan @username.</p></header>
    <StreamTabs active="friends" />
    <FriendsDirectory initial={initial} canManage={!isGuest(viewer)} />
  </div></main>;
}
