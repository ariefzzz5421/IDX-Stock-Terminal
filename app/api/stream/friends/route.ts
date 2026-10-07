import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { friendPair, listFriends } from "@/lib/stream-friends";
import { streamWriter } from "@/lib/stream-validation";
import { GUEST_USERNAME } from "@/lib/auth/guest";

export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Masuk untuk melihat akun." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const search = (params.get("search") ?? "").trim().slice(0, 40);
  const cursor = params.get("cursor") ?? undefined;
  if (cursor && !/^[a-z0-9]{10,40}$/.test(cursor)) return NextResponse.json({ error: "Cursor tidak valid." }, { status: 400 });
  try { return NextResponse.json(await listFriends(viewer.id, search, cursor, params.get("accepted") === "1")); }
  catch { return NextResponse.json({ error: "Daftar akun belum dapat dimuat." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const viewer = await streamWriter(request);
  if (!viewer) return NextResponse.json({ error: "Masuk untuk mengelola teman." }, { status: 401 });
  let input: { username?: unknown; action?: unknown };
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 }); }
  const username = input.username;
  const action = input.action;
  if (typeof username !== "string" || !/^[A-Za-z0-9_]{3,30}$/.test(username) || !["request", "accept", "remove", "decline"].includes(String(action))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { username }, select: { id: true, username: true } });
  if (!target || target.id === viewer.id || target.username === GUEST_USERNAME) return NextResponse.json({ error: "Akun tidak tersedia." }, { status: 404 });
  const pair = friendPair(viewer.id, target.id);
  const where = { userAId_userBId: pair };
  const edge = await prisma.streamFriendship.findUnique({ where });
  if (action === "request") {
    if (edge?.status === "ACCEPTED") return NextResponse.json({ state: "friends" });
    if (edge?.requestedById === viewer.id) return NextResponse.json({ state: "outgoing" });
    if (edge) {
      await prisma.streamFriendship.update({ where, data: { status: "ACCEPTED" } });
      return NextResponse.json({ state: "friends" });
    }
    const pending = await prisma.streamFriendship.count({ where: { requestedById: viewer.id, status: "PENDING" } });
    if (pending >= 30) return NextResponse.json({ error: "Batas 30 permintaan tertunda tercapai." }, { status: 429 });
    try { await prisma.streamFriendship.create({ data: { ...pair, requestedById: viewer.id } }); }
    catch {
      const raced = await prisma.streamFriendship.findUnique({ where });
      if (raced) return NextResponse.json({ state: raced.status === "ACCEPTED" ? "friends" : raced.requestedById === viewer.id ? "outgoing" : "incoming" });
      return NextResponse.json({ error: "Permintaan gagal disimpan." }, { status: 503 });
    }
    return NextResponse.json({ state: "outgoing" }, { status: 201 });
  }
  if (!edge) return NextResponse.json({ state: "none" });
  if (action === "accept") {
    if (edge.status !== "PENDING" || edge.requestedById === viewer.id) return NextResponse.json({ error: "Permintaan masuk tidak ditemukan." }, { status: 409 });
    await prisma.streamFriendship.update({ where, data: { status: "ACCEPTED" } });
    return NextResponse.json({ state: "friends" });
  }
  if (action === "decline" && (edge.status !== "PENDING" || edge.requestedById === viewer.id)) return NextResponse.json({ error: "Permintaan masuk tidak ditemukan." }, { status: 409 });
  await prisma.streamFriendship.delete({ where });
  return NextResponse.json({ state: "none" });
}
