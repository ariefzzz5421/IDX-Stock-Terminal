import "server-only";

import { prisma } from "@/lib/db/prisma";
import { KONGLO_PROFILES, kongloHoldings } from "@/lib/konglo";

const FEED_CATEGORIES = [
  "MERGER_ACQUISITION", "OWNERSHIP", "DIVESTMENT", "TENDER_OFFER",
  "CAPITAL_INJECTION", "SPIN_OFF", "PRIVATE_PLACEMENT",
];
const PAGE_SIZE = 12;

export async function getKongloFeed(person: string | undefined, requestedPage: number, query = "") {
  const profiles = KONGLO_PROFILES.map((profile) => ({
    slug: profile.slug,
    name: profile.name,
    holdings: kongloHoldings(profile),
    pending: profile.pendingExposure ?? [],
  })).filter((profile) => profile.holdings.length || profile.pending.length);
  const selected = person ? profiles.find((profile) => profile.slug === person) : undefined;
  const active = selected ? [selected] : profiles;
  const codeToProfiles = new Map<string, Array<{ slug: string; name: string; kind: "direct" | "group" | "pending" }>>();
  for (const profile of active) {
    for (const holding of profile.holdings) {
      const related = codeToProfiles.get(holding.code) ?? [];
      if (!related.some((item) => item.slug === profile.slug)) related.push({ slug: profile.slug, name: profile.name, kind: holding.kind });
      codeToProfiles.set(holding.code, related);
    }
    for (const pending of profile.pending) {
      const related = codeToProfiles.get(pending.code) ?? [];
      if (!related.some((item) => item.slug === profile.slug)) related.push({ slug: profile.slug, name: profile.name, kind: "pending" });
      codeToProfiles.set(pending.code, related);
    }
  }
  const codes = [...codeToProfiles.keys()];
  const search = query.trim().slice(0, 80);
  const nameCodes = active.filter((profile) => profile.name.toLowerCase().includes(search.toLowerCase())).flatMap((profile) => [...profile.holdings.map((holding) => holding.code), ...profile.pending.map((item) => item.code)]);
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.min(Math.trunc(requestedPage), 1000)) : 1;
  const where = {
    category: { in: FEED_CATEGORIES },
    status: { in: ["CONFIRMED", "PRELIMINARY"] },
    publishedAt: { not: null },
    tickers: { some: { stockCode: { in: codes } } },
    ...(search ? { OR: [
      { title: { contains: search } },
      { summary: { contains: search } },
      { tickers: { some: { stockCode: { contains: search.toUpperCase() } } } },
      ...(nameCodes.length ? [{ tickers: { some: { stockCode: { in: nameCodes } } } }] : []),
    ] } : {}),
  };
  const [total, events, latestRun, latestSuccess] = await Promise.all([
    prisma.intelligenceEvent.count({ where }),
    prisma.intelligenceEvent.findMany({
      where, orderBy: { lastChangedAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      select: {
        id: true, title: true, category: true, status: true, priority: true, summary: true,
        publishedAt: true, lastChangedAt: true, latestVersion: true,
        tickers: { select: { stockCode: true } },
        versions: { orderBy: { eventVersion: "desc" }, take: 1, select: { announcementAt: true, sourceUrl: true, changeType: true } },
      },
    }),
    prisma.researchRun.findFirst({ where: { NOT: { slot: "LOCK" }, dryRun: false }, orderBy: { startedAt: "desc" }, select: { status: true, startedAt: true, endedAt: true, failedAdapters: true } }),
    prisma.researchRun.findFirst({ where: { status: "SUCCESS", dryRun: false }, orderBy: { endedAt: "desc" }, select: { endedAt: true } }),
  ]);
  return {
    profiles, selected, page, total, pageSize: PAGE_SIZE, latestRun, latestSuccess, search,
    events: events.map((event) => ({
      ...event,
      related: [...new Map(event.tickers.flatMap((ticker) => codeToProfiles.get(ticker.stockCode) ?? []).map((profile) => [profile.slug, profile])).values()],
    })),
    pending: active.flatMap((profile) => profile.pending.map((item) => ({ ...item, slug: profile.slug, name: profile.name }))).filter((item) => !search || `${item.code} ${item.holder} ${item.name} ${item.note}`.toLowerCase().includes(search.toLowerCase())),
  };
}
