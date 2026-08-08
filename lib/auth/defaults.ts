/**
 * Tickers a brand-new account starts with, so the dashboard is never an empty
 * grid on first login. A spread across sectors rather than the eight biggest
 * banks.
 */
import { prisma } from "@/lib/db/prisma";

export const DEFAULT_WATCHLIST = [
  "BBCA",
  "BBRI",
  "BMRI",
  "TLKM",
  "ASII",
  "ANTM",
  "ADRO",
  "GOTO",
] as const;

/**
 * Nested-create rows for a new account's watchlist, filtered to tickers that
 * are actually in the database — `stocks` is empty until `prisma db seed`
 * runs, and a missing row would trip the foreign key.
 */
export async function buildDefaultWatchlist() {
  const seeded = await prisma.stock.findMany({
    where: { code: { in: [...DEFAULT_WATCHLIST] } },
    select: { code: true },
  });
  const available = new Set(seeded.map((s) => s.code));

  return DEFAULT_WATCHLIST.filter((code) => available.has(code)).map(
    (code, index) => ({ stockCode: code, sortOrder: index }),
  );
}
