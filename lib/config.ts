import "server-only";

export type MissingSetting = {
  name: string;
  why: string;
  how: string;
};

/**
 * Environment a production deployment cannot start without.
 *
 * Local development can use embedded SQLite. Hosted Vercel deployments need
 * a persistent PostgreSQL database. SESSION_SECRET only needs
 * checking in production: locally, lib/auth/session.ts falls back to a fixed
 * dev-only secret so a fresh clone never gets stuck on a setup screen. A real
 * deployment must not run on that fallback, so it's flagged here instead.
 */
export function missingSettings(): MissingSetting[] {
  const missing: MissingSetting[] = [];

  if (process.env.NODE_ENV === "production") {
    if (process.env.VERCEL === "1" && !/^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL ?? "")) {
      missing.push({
        name: "DATABASE_URL",
        why: "A Vercel deployment needs persistent storage for accounts, watchlists, and the IDX catalogue. The local SQLite file cannot serve as a hosted database.",
        how: "Supabase → Connect → ORM → Prisma: add the transaction pooler URL to Vercel DATABASE_URL. See docs/SUPABASE.md.",
      });
    }
    const secret = process.env.SESSION_SECRET ?? "";
    if (!secret) {
      missing.push({
        name: "SESSION_SECRET",
        why: "Encrypts the login cookie. Required in production — the insecure development default never applies here.",
        how: 'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      });
    } else if (secret.length < 32) {
      missing.push({
        name: "SESSION_SECRET",
        why: `Must be at least 32 characters; yours is ${secret.length}.`,
        how: 'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      });
    }
  }

  return missing;
}
