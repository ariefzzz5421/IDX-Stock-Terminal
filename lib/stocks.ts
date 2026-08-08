import "server-only";

import { prisma } from "@/lib/db/prisma";
import { refreshQuotes } from "@/lib/market-data/sync";
import type { StockRow } from "@/components/terminal/StockTable";

export const STOCK_SELECT = {
  code: true,
  name: true,
  sector: true,
  logoUrl: true,
  lastPrice: true,
  lastChangePct: true,
  lastVolume: true,
  lastValue: true,
  marketCap: true,
} as const;

/**
 * How many of the biggest names to keep quoted so the ranked boards have
 * something real to sort. Refreshing all 800+ on every page load would hammer
 * a free endpoint and take far too long.
 */
const BOARD_SIZE = 40;

/** The tickers a signed-in viewer follows. */
export async function watchlistRows(userId: string): Promise<StockRow[]> {
  const rows = await prisma.watchlist.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
    select: { stock: { select: STOCK_SELECT } },
  });

  return rows.map((row) => row.stock);
}

/**
 * Refresh the viewer's watchlist plus the largest listings by market cap, so
 * gainers/losers/most-active reflect something current rather than whatever
 * happened to be fetched last.
 */
export async function refreshBoard(userId: string) {
  const [followed, biggest] = await Promise.all([
    prisma.watchlist.findMany({
      where: { userId },
      select: { stockCode: true },
    }),
    prisma.stock.findMany({
      where: { marketCap: { not: null } },
      orderBy: { marketCap: "desc" },
      take: BOARD_SIZE,
      select: { code: true },
    }),
  ]);

  const codes = new Set([
    ...followed.map((f) => f.stockCode),
    ...biggest.map((b) => b.code),
  ]);

  await refreshQuotes([...codes]);
}

/** Only rows that actually carry a quote — otherwise every board is all nulls. */
const QUOTED = { lastChangePct: { not: null }, lastPrice: { not: null } };

export function topGainers(take = 10) {
  return prisma.stock.findMany({
    where: { ...QUOTED, lastChangePct: { gt: 0 } },
    orderBy: { lastChangePct: "desc" },
    take,
    select: STOCK_SELECT,
  });
}

export function topLosers(take = 10) {
  return prisma.stock.findMany({
    where: { ...QUOTED, lastChangePct: { lt: 0 } },
    orderBy: { lastChangePct: "asc" },
    take,
    select: STOCK_SELECT,
  });
}

export function mostActive(take = 10) {
  return prisma.stock.findMany({
    where: { lastValue: { not: null, gt: 0 } },
    orderBy: { lastValue: "desc" },
    take,
    select: STOCK_SELECT,
  });
}

export function largestByMarketCap(take = 20) {
  return prisma.stock.findMany({
    where: { marketCap: { not: null } },
    orderBy: { marketCap: "desc" },
    take,
    select: STOCK_SELECT,
  });
}

/**
 * "Hot" is movement backed by turnover — a 20% move on nothing traded is noise,
 * not a signal. Rank by |change| but only among names with real value traded.
 */
export async function hotStocks(take = 20): Promise<StockRow[]> {
  const candidates = await prisma.stock.findMany({
    where: { ...QUOTED, lastValue: { not: null, gt: 0 } },
    orderBy: { lastValue: "desc" },
    take: 120,
    select: STOCK_SELECT,
  });

  return candidates
    .sort(
      (a, b) =>
        Math.abs(b.lastChangePct ?? 0) - Math.abs(a.lastChangePct ?? 0),
    )
    .slice(0, take);
}

export async function boardCounts() {
  const [total, quoted] = await Promise.all([
    prisma.stock.count(),
    prisma.stock.count({ where: QUOTED }),
  ]);
  return { total, quoted };
}
