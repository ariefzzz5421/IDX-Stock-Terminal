import "server-only";

import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { buildDefaultWatchlist } from "./defaults";
import { UNIQUE_VIOLATION, prismaErrorCode } from "@/lib/db/errors";

export const GUEST_USERNAME = "guest";

/**
 * Auth is off by default so the terminal opens straight onto the dashboard.
 * Set AUTH_REQUIRED=true to put the login wall back.
 */
export function authRequired(): boolean {
  return process.env.AUTH_REQUIRED === "true";
}

export const USER_SELECT = {
  id: true,
  username: true,
  createdAt: true,
  profile: { select: { displayName: true, bio: true, avatarUrl: true } },
} as const;

/**
 * The shared account everything hangs off when nobody is signed in. Its
 * watchlist and profile are common to every visitor, which is the right
 * trade-off for a single-operator terminal.
 *
 * The password hash is a discarded random value: the row must satisfy the
 * schema and survive a bcrypt comparison without ever matching a real login.
 */
export async function getOrCreateGuestUser() {
  const existing = await prisma.user.findUnique({
    where: { username: GUEST_USERNAME },
    select: USER_SELECT,
  });
  if (existing) return existing;

  try {
    return await prisma.user.create({
      data: {
        username: GUEST_USERNAME,
        passwordHash: await hash(randomUUID(), 10),
        profile: { create: { displayName: "Guest" } },
        watchlist: { create: await buildDefaultWatchlist() },
      },
      select: USER_SELECT,
    });
  } catch (error) {
    // Two first-time visitors can race here; whoever lost just reads the row.
    if (prismaErrorCode(error) === UNIQUE_VIOLATION) {
      const raced = await prisma.user.findUnique({
        where: { username: GUEST_USERNAME },
        select: USER_SELECT,
      });
      if (raced) return raced;
    }
    throw error;
  }
}
