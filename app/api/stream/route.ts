import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { listStreamPosts } from "@/lib/stream";
import { streamWriter, validatePhoto } from "@/lib/stream-validation";
import { verifyFriendMentions } from "@/lib/stream-friends";

export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Masuk untuk melihat Stream." }, { status: 401 });
  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
  const author = new URL(request.url).searchParams.get("author") ?? undefined;
  if (cursor && !/^[a-z0-9]{10,40}$/.test(cursor)) return NextResponse.json({ error: "Cursor tidak valid." }, { status: 400 });
  if (author && !/^[a-zA-Z0-9_]{3,30}$/.test(author)) return NextResponse.json({ error: "Nama akun tidak valid." }, { status: 400 });
  const profile = author ? await prisma.user.findUnique({ where: { username: author }, select: { id: true } }) : null;
  if (author && !profile) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
  try { return NextResponse.json(await listStreamPosts(viewer.id, { cursor, authorId: profile?.id })); }
  catch { return NextResponse.json({ error: "Feed belum dapat dimuat." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const user = await streamWriter(request);
  if (!user) return NextResponse.json({ error: "Masuk dengan akun pribadi untuk menulis di Stream." }, { status: 401 });
  if (Number(request.headers.get("content-length") ?? 0) > 700_000) return NextResponse.json({ error: "Foto terlalu besar." }, { status: 413 });
  let input: { body?: unknown; kind?: unknown; tickers?: unknown; photo?: unknown };
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Data posting tidak valid." }, { status: 400 }); }
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const kind = input.kind === "thesis" ? "thesis" : "status";
  const tickers = Array.isArray(input.tickers) ? [...new Set(input.tickers.filter((item): item is string => typeof item === "string").map((item) => item.trim().toUpperCase()))] : [];
  const photo = validatePhoto(input.photo);
  if (body.length < 2 || body.length > 2000) return NextResponse.json({ error: "Tulis 2–2.000 karakter." }, { status: 400 });
  if (tickers.length > 5 || tickers.some((code) => !/^[A-Z0-9]{4,6}$/.test(code))) return NextResponse.json({ error: "Pilih maksimal 5 kode saham." }, { status: 400 });
  if (photo === undefined) return NextResponse.json({ error: "Gunakan foto PNG, JPG, atau WebP di bawah 350 KB." }, { status: 400 });
  if (!(await verifyFriendMentions(body, user.id))) return NextResponse.json({ error: "Tag hanya untuk teman yang sudah menerima permintaan. Periksa @username." }, { status: 400 });
  if (tickers.length) {
    const matches = await prisma.stock.count({ where: { code: { in: tickers }, isListed: true } });
    if (matches !== tickers.length) return NextResponse.json({ error: "Ada kode saham yang tidak terdaftar." }, { status: 400 });
  }
  const latest = await prisma.streamPost.findFirst({ where: { authorId: user.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  if (latest && Date.now() - latest.createdAt.getTime() < 15_000) return NextResponse.json({ error: "Tunggu 15 detik sebelum posting lagi." }, { status: 429 });
  const post = await prisma.streamPost.create({ data: { authorId: user.id, body, kind, tickers: JSON.stringify(tickers), photoData: photo, hasPhoto: Boolean(photo) }, select: { id: true } });
  return NextResponse.json({ id: post.id }, { status: 201 });
}
