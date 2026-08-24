import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  GUEST_USERNAME,
  USER_SELECT,
  authRequired,
  getOrCreateGuestUser,
} from "./guest";

export type SessionData = {
  userId?: string;
  username?: string;
};

const SESSION_TTL_DAYS = 30;

/**
 * Never used in production -- guarded below by NODE_ENV. Exists so a fresh
 * clone can run `npm run dev` with no .env file at all and nothing blocks it.
 */
const INSECURE_DEV_ONLY_SECRET =
  "dev-only-insecure-secret-do-not-use-in-production-00000000";

let warnedAboutDevSecret = false;

function sessionOptions() {
  let password = process.env.SESSION_SECRET;

  if ((!password || password.length < 32) && process.env.NODE_ENV !== "production") {
    if (!warnedAboutDevSecret) {
      console.warn(
        "[auth] SESSION_SECRET not set -- using an insecure development-only " +
          "default. Fine for local use; set a real SESSION_SECRET before " +
          "deploying anywhere.",
      );
      warnedAboutDevSecret = true;
    }
    password = INSECURE_DEV_ONLY_SECRET;
  }

  if (!password || password.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set and at least 32 characters. Generate one with:\n" +
        '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }

  return {
    password,
    cookieName: "idx_terminal_session",
    ttl: SESSION_TTL_DAYS * 24 * 60 * 60,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax" as const,
      // Local development is plain http, so this can't be unconditional.
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

/**
 * The user who actually signed in, or null. Never falls back to guest — use
 * this to decide whether to *offer* signing in, not to load data.
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: USER_SELECT,
  });

  // The cookie outlives the row if the user was deleted — treat that as signed out.
  if (!user) {
    session.destroy();
    return null;
  }

  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * Whoever the page should render for: the signed-in user, or the shared guest
 * account when auth is off. Use this to load and mutate data.
 */
export async function getViewer(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (user) return user;
  if (authRequired()) return null;
  return getOrCreateGuestUser();
}

export function isGuest(user: { username: string }): boolean {
  return user.username === GUEST_USERNAME;
}

/**
 * For pages that need a user. With auth off this always succeeds, so the
 * dashboard opens without a login step; with AUTH_REQUIRED=true it redirects.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getViewer();
  if (!user) redirect("/login");
  return user;
}

export async function createSession(userId: string, username: string) {
  const session = await getSession();
  session.userId = userId;
  session.username = username;
  await session.save();
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
}
