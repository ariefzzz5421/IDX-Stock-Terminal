import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { streamWriter } from "@/lib/stream-validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await streamWriter(request);
  if (!user) return NextResponse.json({ error: "Masuk untuk memberi like." }, { status: 401 });
  const { id } = await params;
  const post = await prisma.streamPost.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Posting tidak ditemukan." }, { status: 404 });
  const key = { postId_userId: { postId: id, userId: user.id } };
  const existing = await prisma.streamLike.findUnique({ where: key, select: { postId: true } });
  if (existing) await prisma.streamLike.delete({ where: key });
  else await prisma.streamLike.create({ data: { postId: id, userId: user.id } });
  return NextResponse.json({ liked: !existing, count: await prisma.streamLike.count({ where: { postId: id } }) });
}
