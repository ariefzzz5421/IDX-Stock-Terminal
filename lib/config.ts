import "server-only";

export type MissingSetting = {
  name: string;
  why: string;
  how: string;
};

/**
 * Environment the app cannot start without.
 *
 * Checked before rendering rather than left to blow up mid-request: in
 * production React strips server error messages, so an unconfigured deployment
 * would otherwise surface as a minified React error with no hint at the cause.
 */
export function missingSettings(): MissingSetting[] {
  const missing: MissingSetting[] = [];

  if (!process.env.DATABASE_URL) {
    missing.push({
      name: "DATABASE_URL",
      why: "Where users, watchlists and price history are stored.",
      how: "postgresql://user:password@host:5432/idx_terminal?schema=public",
    });
  }

  const secret = process.env.SESSION_SECRET ?? "";
  if (!secret) {
    missing.push({
      name: "SESSION_SECRET",
      why: "Encrypts the login cookie.",
      how: 'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    });
  } else if (secret.length < 32) {
    missing.push({
      name: "SESSION_SECRET",
      why: `Must be at least 32 characters; yours is ${secret.length}.`,
      how: 'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    });
  }

  return missing;
}
