import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/auth/session";
import { DEFAULT_WATCHLIST } from "@/lib/auth/defaults";
import {
  normalizeUsername,
  validatePassword,
  validateUsername,
} from "@/lib/auth/validation";

const BCRYPT_ROUNDS = 10;

export async function POST(request: Request) {
  let body: { username?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const username = normalizeUsername(body.username ?? "");
  const password = body.password ?? "";

  const usernameCheck = validateUsername(username);
  if (!usernameCheck.ok) {
    return NextResponse.json({ error: usernameCheck.error }, { status: 400 });
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.ok) {
    return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "That username is taken." },
      { status: 409 },
    );
  }

  const passwordHash = await hash(password, BCRYPT_ROUNDS);

  // Only seed watchlist rows for tickers that actually exist — the stocks table
  // is empty until `prisma db seed` runs, and a missing row would trip the FK.
  const seededStocks = await prisma.stock.findMany({
    where: { code: { in: [...DEFAULT_WATCHLIST] } },
    select: { code: true },
  });
  const available = new Set(seededStocks.map((s) => s.code));

  try {
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        profile: { create: { displayName: username } },
        watchlist: {
          create: DEFAULT_WATCHLIST.filter((code) => available.has(code)).map(
            (code, index) => ({ stockCode: code, sortOrder: index }),
          ),
        },
      },
      select: { id: true, username: true },
    });

    await createSession(user.id, user.username);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    // Two simultaneous registrations of the same name land here.
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "That username is taken." }, { status: 409 });
    }
    throw error;
  }
}
