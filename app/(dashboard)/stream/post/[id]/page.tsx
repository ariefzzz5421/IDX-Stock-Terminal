import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isGuest, requireUser } from "@/lib/auth/session";
import { getStreamPost } from "@/lib/stream";
import { StreamCard } from "@/components/stream/StreamFeed";

export const metadata: Metadata = { title: "Posting Stream — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function StreamPostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const post = await getStreamPost(id, user.id);
  if (!post) notFound();
  return <main className="min-w-0 flex-1 bg-void px-3 py-5 sm:px-6"><div className="mx-auto max-w-3xl space-y-4"><Link href="/stream" className="text-xs text-cyan hover:underline">← Kembali ke Stream</Link><StreamCard post={post} canInteract={!isGuest(user)} viewerUsername={user.username} /></div></main>;
}
