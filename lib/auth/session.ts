import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

export type SessionData = {
  userId?: string;
  username?: string;
};

const SESSION_TTL_DAYS = 30;

function sessionOptions() {
  const password = process.env.SESSION_SECRET;

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

/** The signed-in user, or null. Does not redirect. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      createdAt: true,
      profile: {
        select: { displayName: true, bio: true, avatarUrl: true },
      },
    },
  });

  // The cookie outlives the row if the user was deleted — treat that as signed out.
  if (!user) {
    session.destroy();
    return null;
  }

  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For protected pages: returns the user or redirects to /login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
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
