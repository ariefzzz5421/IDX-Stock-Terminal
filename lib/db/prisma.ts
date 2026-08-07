import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

type Client = ReturnType<typeof createPrismaClient>;

// Prisma 7 connects through a driver adapter rather than a native engine, so
// the pg pool is what actually holds the connections.
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and point it at your PostgreSQL database.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Cached on globalThis so `next dev` hot reloads reuse one pool instead of
// leaking a new one per reload.
const globalForPrisma = globalThis as unknown as { prisma?: Client };

function getClient(): Client {
  globalForPrisma.prisma ??= createPrismaClient();
  return globalForPrisma.prisma;
}

/**
 * Lazily constructed: `next build` imports every route module to read its
 * config, and CI has no DATABASE_URL. Connecting eagerly at import time would
 * fail the build before a single request is ever served, so the client is only
 * built on first actual use — where a missing URL is a real error worth
 * throwing, and the error boundary can explain it.
 */
export const prisma = new Proxy({} as Client, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property) as unknown;
    // `$transaction`, `$disconnect` and friends need their original `this`.
    return typeof value === "function" ? value.bind(client) : value;
  },
});
