import "server-only";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/lib/db/generated/client";
import { SOURCE_GAPS } from "./pipeline";

export type ResearchFilters = {
  ticker?: string; q?: string; categories?: string[]; priorities?: string[]; statuses?: string[];
  directions?: string[]; from?: string; latest?: boolean; watchlist?: boolean; sort?: "newest" | "oldest" | "priority";
  page?: number;
};

export async function listResearch(filters: ResearchFilters, userId: string) {
  const where: Prisma.IntelligenceEventWhereInput = {};
  const tickerConditions: Prisma.IntelligenceEventWhereInput[] = [];
  if (filters.ticker) tickerConditions.push({ tickers: { some: { stockCode: filters.ticker.toUpperCase() } } });
  if (filters.watchlist) tickerConditions.push({ tickers: { some: { stock: { watchlists: { some: { userId } } } } } });
  if (tickerConditions.length) where.AND = tickerConditions;
  if (filters.categories?.length) where.category = { in: filters.categories };
  if (filters.priorities?.length) where.priority = { in: filters.priorities };
  if (filters.statuses?.length) where.status = { in: filters.statuses };
  if (filters.directions?.length) where.direction = { in: filters.directions };
  if (filters.from) { const date = new Date(filters.from); if (!Number.isNaN(date.getTime())) where.publishedAt = { gte: date }; }
  if (filters.q) where.OR = [{ title: { contains: filters.q } }, { summary: { contains: filters.q } }, { tickers: { some: { stockCode: { contains: filters.q.toUpperCase() } } } }];
  if (filters.latest) {
    const lastTwo = await prisma.researchRun.findMany({ where: { status: "SUCCESS", dryRun: false }, orderBy: { endedAt: "desc" }, take: 2, select: { endedAt: true } });
    if (lastTwo[1]?.endedAt) where.lastChangedAt = { gt: lastTwo[1].endedAt };
  }
  const page = Math.max(1, Math.min(filters.page ?? 1, 1000));
  const orderBy: Prisma.IntelligenceEventOrderByWithRelationInput = filters.sort === "oldest" ? { publishedAt: "asc" } : filters.sort === "priority" ? { score: "desc" } : { publishedAt: "desc" };
  const [total, events] = await Promise.all([
    prisma.intelligenceEvent.count({ where }),
    prisma.intelligenceEvent.findMany({
      where, orderBy, skip: (page - 1) * 20, take: 20,
      include: { tickers: { select: { stockCode: true, securityCode: true, securityType: true } }, versions: { orderBy: { eventVersion: "desc" }, take: filters.latest ? 1 : 5, select: { id: true, eventVersion: true, changeType: true, publishedAt: true, announcementAt: true, effectiveAt: true, sourceUrl: true, factsJson: true } } },
    }),
  ]);
  return { total, page, events };
}

export async function intelligenceOverview(userId: string) {
  const [latestRun, latestSuccess, recentEvents, priorityCount, eventCount, confirmed, preliminary, affected, notifications] = await Promise.all([
    prisma.researchRun.findFirst({ where: { NOT: { slot: "LOCK" }, dryRun: false }, orderBy: { startedAt: "desc" } }),
    prisma.researchRun.findFirst({ where: { status: "SUCCESS", dryRun: false }, orderBy: { endedAt: "desc" } }),
    prisma.intelligenceEvent.count({ where: { publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60_000) } } }),
    prisma.intelligenceEvent.count({ where: { priority: { in: ["CRITICAL", "HIGH"] } } }),
    prisma.intelligenceEvent.count(),
    prisma.intelligenceEvent.count({ where: { status: "CONFIRMED" } }),
    prisma.intelligenceEvent.count({ where: { status: "PRELIMINARY" } }),
    prisma.intelligenceTicker.groupBy({ by: ["stockCode"] }),
    prisma.researchNotification.count({ where: { userId, readAt: null } }),
  ]);
  return { latestRun, latestSuccess, recentEvents, priorityCount, eventCount, confirmed, preliminary, affected: affected.length, unread: notifications, sourceGaps: SOURCE_GAPS };
}

export async function researchRunHistory(page = 1) {
  const safePage = Math.max(1, Math.min(Number.isFinite(page) ? Math.trunc(page) : 1, 1000));
  const where: Prisma.ResearchRunWhereInput = { NOT: { slot: "LOCK" }, dryRun: false };
  const [total, runs] = await Promise.all([
    prisma.researchRun.count({ where }),
    prisma.researchRun.findMany({
      where, orderBy: { startedAt: "desc" }, skip: (safePage - 1) * 10, take: 10,
      select: { id: true, slot: true, status: true, startedAt: true, endedAt: true, newEvents: true, updatedEvents: true, sourcesChecked: true, failedAdapters: true },
    }),
  ]);
  return { total, page: safePage, runs };
}

export async function syncNotifications(userId: string) {
  const latestSuccess = await prisma.researchRun.findFirst({ where: { status: "SUCCESS", dryRun: false }, orderBy: { endedAt: "desc" }, select: { endedAt: true } });
  if (!latestSuccess?.endedAt) return;
  const versions = await prisma.intelligenceEventVersion.findMany({
    where: { publishedAt: { lte: latestSuccess.endedAt }, priority: { in: ["CRITICAL", "HIGH", "MEDIUM"] }, status: { in: ["CONFIRMED", "PRELIMINARY"] }, notifications: { none: { userId } } },
    take: 50, orderBy: { publishedAt: "desc" }, select: { id: true },
  });
  for (const version of versions) await prisma.researchNotification.upsert({
    where: { userId_versionId: { userId, versionId: version.id } },
    create: { userId, versionId: version.id }, update: {},
  });
}
