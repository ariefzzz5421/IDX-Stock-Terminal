import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/auth/session";
import { buildDefaultWatchlist } from "@/lib/auth/defaults";
import {
  normalizeUsername,
  validatePassword,
  validateUsername,
} from "@/lib/auth/validation";
import {
  UNIQUE_VIOLATION,
  prismaErrorCode,
  routeErrorResponse,
} from "@/lib/db/errors";

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

  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: "That username is taken." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        profile: { create: { displayName: username } },
        watchlist: { create: await buildDefaultWatchlist() },
      },
      select: { id: true, username: true },
    });

    await createSession(user.id, user.username);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    // Two simultaneous registrations of the same name land here.
    if (prismaErrorCode(error) === UNIQUE_VIOLATION) {
      return NextResponse.json({ error: "That username is taken." }, { status: 409 });
    }
    return routeErrorResponse(error, "auth/register");
  }
}
