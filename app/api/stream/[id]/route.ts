import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { streamWriter, validatePhoto } from "@/lib/stream-validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const user = await streamWriter(request);
  if (!user) return NextResponse.json({ error: "Masuk untuk mengubah posting." }, { status: 401 });
  if (Number(request.headers.get("content-length") ?? 0) > 700_000) return NextResponse.json({ error: "Foto terlalu besar." }, { status: 413 });
  const { id } = await params;
  let input: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid post body");
    input = parsed as Record<string, unknown>;
  } catch { return NextResponse.json({ error: "Data posting tidak valid." }, { status: 400 }); }
  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (body.length < 2 || body.length > 2000) return NextResponse.json({ error: "Tulis 2–2.000 karakter." }, { status: 400 });
  if (input.kind !== "status" && input.kind !== "thesis") return NextResponse.json({ error: "Jenis posting tidak valid." }, { status: 400 });
  if (!Array.isArray(input.tickers) || input.tickers.some((item) => typeof item !== "string")) return NextResponse.json({ error: "Tag saham tidak valid." }, { status: 400 });
  const tickers = [...new Set((input.tickers as string[]).map((item) => item.trim().toUpperCase()))];
  if (tickers.length > 5 || tickers.some((code) => !/^[A-Z0-9]{4,6}$/.test(code))) return NextResponse.json({ error: "Pilih maksimal 5 kode saham." }, { status: 400 });
  const hasPhotoInput = Object.hasOwn(input, "photo");
  const photo = hasPhotoInput ? validatePhoto(input.photo) : undefined;
  if (hasPhotoInput && photo === undefined) return NextResponse.json({ error: "Gunakan foto PNG, JPG, atau WebP di bawah 350 KB." }, { status: 400 });
  if (tickers.length) {
    const matches = await prisma.stock.count({ where: { code: { in: tickers }, isListed: true } });
    if (matches !== tickers.length) return NextResponse.json({ error: "Ada kode saham yang tidak terdaftar." }, { status: 400 });
  }
  const result = await prisma.streamPost.updateMany({
    where: { id, authorId: user.id },
    data: { body, kind: input.kind, tickers: JSON.stringify(tickers), ...(hasPhotoInput ? { photoData: photo, hasPhoto: Boolean(photo) } : {}) },
  });
  if (!result.count) return NextResponse.json({ error: "Posting tidak ditemukan atau bukan milikmu." }, { status: 404 });
  return NextResponse.json({ id });
}

export async function DELETE(request: Request, { params }: Context) {
  const user = await streamWriter(request);
  if (!user) return NextResponse.json({ error: "Masuk untuk menghapus posting." }, { status: 401 });
  const { id } = await params;
  const result = await prisma.streamPost.deleteMany({ where: { id, authorId: user.id } });
  if (!result.count) return NextResponse.json({ error: "Posting tidak ditemukan atau bukan milikmu." }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
