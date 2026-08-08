import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getViewer } from "@/lib/auth/session";

export async function GET() {
  const user = await getViewer();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const rows = await prisma.watchlist.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: "asc" },
    include: { stock: true },
  });

  return NextResponse.json({ watchlist: rows });
}

export async function POST(request: Request) {
  const user = await getViewer();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const code = (body.code ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "A ticker code is required." }, { status: 400 });
  }

  const stock = await prisma.stock.findUnique({ where: { code } });
  if (!stock) {
    return NextResponse.json(
      { error: `${code} is not in the stock universe. Run \`npm run db:seed\`?` },
      { status: 404 },
    );
  }

  // Append to the end of the list.
  const last = await prisma.watchlist.findFirst({
    where: { userId: user.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.watchlist.upsert({
    where: { userId_stockCode: { userId: user.id, stockCode: code } },
    update: {},
    create: {
      userId: user.id,
      stockCode: code,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ ok: true, code }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getViewer();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const code = new URL(request.url).searchParams.get("code")?.toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "A ticker code is required." }, { status: 400 });
  }

  await prisma.watchlist.deleteMany({
    where: { userId: user.id, stockCode: code },
  });

  return NextResponse.json({ ok: true, code });
}
