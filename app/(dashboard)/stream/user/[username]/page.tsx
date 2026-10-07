import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isGuest, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { listStreamPosts } from "@/lib/stream";
import { StreamFeed } from "@/components/stream/StreamFeed";
import { StreamAvatar } from "@/components/stream/StreamAvatar";
import { FriendAction } from "@/components/stream/FriendsDirectory";
import { friendPair } from "@/lib/stream-friends";

export const metadata: Metadata = { title: "Profil Stream — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function StreamUserPage({ params }: { params: Promise<{ username: string }> }) {
  const viewer = await requireUser();
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true, username: true, createdAt: true, profile: { select: { displayName: true, bio: true, avatarUrl: true } }, _count: { select: { streamPosts: true } } } });
  if (!user) notFound();
  const feed = await listStreamPosts(viewer.id, { authorId: user.id });
  const friendship = user.id === viewer.id ? null : await prisma.streamFriendship.findUnique({ where: { userAId_userBId: friendPair(viewer.id, user.id) } });
  const friendState = !friendship ? "none" : friendship.status === "ACCEPTED" ? "friends" : friendship.requestedById === viewer.id ? "outgoing" : "incoming";
  const display = user.profile?.displayName || user.username;
  return <main className="min-w-0 flex-1 bg-void px-3 py-5 sm:px-6"><div className="mx-auto max-w-3xl space-y-4"><Link href="/stream" className="text-xs text-cyan hover:underline">← Kembali ke Stream</Link><header className="flex min-w-0 flex-wrap items-center gap-4 border border-rule-hi bg-panel p-4 sm:p-6"><StreamAvatar url={user.profile?.avatarUrl ?? null} name={display} size={72} /><div className="min-w-0 flex-1"><h1 className="truncate font-display text-xl font-bold text-ink-hi">{display}</h1><p className="text-xs text-cyan">@{user.username}</p><p className="mt-2 break-words text-xs text-ink">{user.profile?.bio || "Profil Stream"}</p><p className="mt-2 text-micro text-dim">{user._count.streamPosts} posting · Bergabung {user.createdAt.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium" })}</p></div>{user.id !== viewer.id && <FriendAction username={user.username} initialState={friendState} canManage={!isGuest(viewer)} />}</header><StreamFeed initialPosts={feed.posts} initialCursor={feed.nextCursor} canInteract={!isGuest(viewer)} viewerUsername={viewer.username} paginated author={user.username} /></div></main>;
}
