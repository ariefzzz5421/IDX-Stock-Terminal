import "server-only";
import { prisma } from "@/lib/db/prisma";
import { referencedKseiAnnouncement } from "./core";

/** Join an explicitly referenced follow-up to the original event without losing either source or version. */
export async function reconcileKseiFollowUps(): Promise<number> {
  const sources = await prisma.intelligenceSource.findMany({
    where: { eventId: { not: null }, excerpt: { not: null } },
    orderBy: { lastCheckedAt: "desc" }, take: 200,
    select: { sourceDocumentId: true, eventId: true, excerpt: true },
  });
  let merged = 0;
  for (const source of sources) {
    const referencedId = referencedKseiAnnouncement(source.excerpt ?? "");
    if (!referencedId || !source.eventId || referencedId === source.sourceDocumentId) continue;
    const referencedSource = await prisma.intelligenceSource.findUnique({
      where: { sourceDocumentId: referencedId }, select: { eventId: true },
    });
    if (!referencedSource?.eventId || referencedSource.eventId === source.eventId) continue;
    const [parent, followUp] = await Promise.all([
      prisma.intelligenceEvent.findUnique({ where: { id: referencedSource.eventId }, include: { tickers: true, versions: { orderBy: { eventVersion: "desc" }, take: 1 } } }),
      prisma.intelligenceEvent.findUnique({ where: { id: source.eventId }, include: { tickers: true, versions: { orderBy: { eventVersion: "asc" } } } }),
    ]);
    if (!parent || !followUp || parent.category !== followUp.category || !parent.versions[0] || !followUp.versions.length) continue;
    const parentTickers = new Set(parent.tickers.map((ticker) => ticker.stockCode));
    if (!followUp.tickers.some((ticker) => parentTickers.has(ticker.stockCode))) continue;
    await prisma.$transaction(async (tx) => {
      let previousVersionId = parent.versions[0].id;
      for (const [index, version] of followUp.versions.entries()) {
        await tx.intelligenceEventVersion.update({
          where: { id: version.id },
          data: { eventId: parent.id, eventVersion: parent.latestVersion + index + 1,
            previousVersionId, changeType: index === 0 ? "SOURCE_FOLLOW_UP" : version.changeType },
        });
        previousVersionId = version.id;
      }
      await tx.intelligenceSource.updateMany({ where: { eventId: followUp.id }, data: { eventId: parent.id } });
      for (const ticker of followUp.tickers) {
        await tx.intelligenceTicker.upsert({
          where: { eventId_securityCode: { eventId: parent.id, securityCode: ticker.securityCode } },
          create: { eventId: parent.id, stockCode: ticker.stockCode, securityCode: ticker.securityCode, securityType: ticker.securityType },
          update: {},
        });
      }
      await tx.intelligenceEvent.update({ where: { id: parent.id }, data: {
        title: followUp.title, priority: followUp.priority, status: followUp.status,
        direction: followUp.direction, score: followUp.score, summary: followUp.summary,
        publishedAt: followUp.publishedAt, effectiveAt: followUp.effectiveAt,
        lastChangedAt: followUp.lastChangedAt, lastCheckedAt: new Date(),
        latestVersion: parent.latestVersion + followUp.versions.length,
      } });
      await tx.intelligenceEvent.delete({ where: { id: followUp.id } });
    });
    merged++;
  }
  return merged;
}
