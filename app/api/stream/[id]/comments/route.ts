import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { streamWriter } from "@/lib/stream-validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await streamWriter(request);
  if (!user) return NextResponse.json({ error: "Masuk untuk berkomentar." }, { status: 401 });
  const { id } = await params;
  let input: { body?: unknown };
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Komentar tidak valid." }, { status: 400 }); }
  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (body.length < 1 || body.length > 500) return NextResponse.json({ error: "Komentar maksimal 500 karakter." }, { status: 400 });
  const post = await prisma.streamPost.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Posting tidak ditemukan." }, { status: 404 });
  const latest = await prisma.streamComment.findFirst({ where: { authorId: user.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  if (latest && Date.now() - latest.createdAt.getTime() < 3_000) return NextResponse.json({ error: "Tunggu sebentar sebelum berkomentar lagi." }, { status: 429 });
  const comment = await prisma.streamComment.create({ data: { authorId: user.id, postId: id, body }, select: { id: true } });
  return NextResponse.json({ id: comment.id }, { status: 201 });
}
