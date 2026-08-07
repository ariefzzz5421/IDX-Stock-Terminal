import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/auth/session";
import { normalizeUsername } from "@/lib/auth/validation";
import { routeErrorResponse } from "@/lib/db/errors";

/**
 * Comparing against a throwaway hash when the user does not exist keeps the
 * response time roughly constant, so the endpoint does not leak which
 * usernames are registered. Precomputed rather than hashed at module load so
 * it costs nothing on cold start; it is not a credential for anything.
 */
const DUMMY_HASH = "$2b$10$6ewu3R5S5ps6kjgXoRWvEu96fpbcE75bol72njlcTLpgOa8mlM6BW";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const username = normalizeUsername(body.username ?? "");
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Enter your username and password." },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, passwordHash: true },
    });

    const matches = await compare(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !matches) {
      return NextResponse.json(
        { error: "Wrong username or password." },
        { status: 401 },
      );
    }

    await createSession(user.id, user.username);

    return NextResponse.json({
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    return routeErrorResponse(error, "auth/login");
  }
}
