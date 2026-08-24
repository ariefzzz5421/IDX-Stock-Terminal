import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/client";

type Client = ReturnType<typeof createPrismaClient>;

/**
 * Embedded SQLite by default — zero external service, so `npm install && npm
 * run dev` works with nothing else to configure. The file lives next to the
 * schema and is gitignored; `npm run db:setup` / `postinstall` create it.
 */
const DEFAULT_DATABASE_URL = "file:./prisma/dev.db";

function createPrismaClient() {
  const url = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Cached on globalThis so `next dev` hot reloads reuse one connection instead
// of leaking a new one per reload.
const globalForPrisma = globalThis as unknown as { prisma?: Client };

function getClient(): Client {
  globalForPrisma.prisma ??= createPrismaClient();
  return globalForPrisma.prisma;
}

/**
 * Lazily constructed: `next build` imports every route module to read its
 * config, so connecting eagerly at import time would open a database handle
 * before a single request is served. Built on first actual use instead.
 */
export const prisma = new Proxy({} as Client, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property) as unknown;
    // `$transaction`, `$disconnect` and friends need their original `this`.
    return typeof value === "function" ? value.bind(client) : value;
  },
});
