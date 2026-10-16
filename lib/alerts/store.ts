import "server-only";
import { prisma } from "@/lib/db/prisma";
import { eventEmbed, sendDiscordEmbed } from "./discord";
import { eligiblePriorities, isAlertEligible, nextRetryDelayMs, type AlertPriority } from "./rules";

const DESTINATION = "discord:primary";
const MAX_ATTEMPTS = 6;

export function discordWebhookConfigured(): boolean {
  return Boolean(process.env.DISCORD_WEBHOOK_URL?.trim());
}

export async function getAlertSettings() {
  return prisma.discordAlertSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

/** Called before a non-dry scan to set the initial cutoff: never backfill old research. */
export async function prepareDiscordAlerts(): Promise<void> {
  if (!discordWebhookConfigured()) return;
  try { await getAlertSettings(); }
  catch (error) { console.error("[alerts] unable to initialize configuration", error instanceof Error ? error.message : "unknown"); }
}

export async function updateAlertSettings(input: { enabled: boolean; minimumPriority: AlertPriority; includePreliminary: boolean }) {
  const previous = await getAlertSettings();
  const saved = await prisma.discordAlertSettings.update({
    where: { id: previous.id },
    data: {
      enabled: input.enabled,
      minimumPriority: input.minimumPriority,
      includePreliminary: input.includePreliminary,
      ...(!previous.enabled && input.enabled ? { enabledAt: new Date() } : {}),
    },
  });
  // A disabled or tightened filter must never flush previously queued messages.
  if (!saved.enabled) {
    await prisma.discordAlertDelivery.updateMany({
      where: { kind: "EVENT", status: { in: ["PENDING", "RETRY", "FAILED"] } },
      data: { status: "SKIPPED", lastError: "Notifications disabled by administrator" },
    });
  }
  return saved;
}

export async function updateMarketSettings(input: {marketDigestEnabled:boolean;priceLimitsEnabled:boolean;marketTopCount:5|10}) {
  const previous = await getAlertSettings();
  return prisma.discordAlertSettings.update({where:{id:previous.id},data:input});
}

export async function syncDiscordOutbox() {
  const settings = await getAlertSettings();
  if (!settings.enabled || !discordWebhookConfigured()) return 0;
  const statuses = settings.includePreliminary ? ["CONFIRMED", "PRELIMINARY"] : ["CONFIRMED"];
  const priorities = eligiblePriorities(settings.minimumPriority as AlertPriority);
  let added = 0;
  // Versions with an outbox row are never re-enqueued, including already SENT rows.
  // Query only eligible, previously unseen versions to avoid spinning on excluded rows.
  for (let page = 0; page < 10; page++) {
    const versions = await prisma.intelligenceEventVersion.findMany({
      where: {
        createdAt: { gte: settings.enabledAt },
        status: { in: statuses },
        priority: { in: priorities },
        deliveries: { none: { destination: DESTINATION, kind: "EVENT" } },
      },
      select: { id: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 50,
    });
    for (const version of versions) {
      await prisma.discordAlertDelivery.upsert({
        where: { destination_versionId: { destination: DESTINATION, versionId: version.id } },
        create: { destination: DESTINATION, versionId: version.id, kind: "EVENT", status: "PENDING" },
        update: {},
      });
      added++;
    }
    if (versions.length < 50) break;
  }
  return added;
}

export async function dispatchDiscordOutbox(limit = 10) {
  const settings = await getAlertSettings();
  if (!settings.enabled || !discordWebhookConfigured()) return { sent: 0, failed: 0 };
  const now = new Date();
  const jobs = await prisma.discordAlertDelivery.findMany({
    where: {
      kind: "EVENT",
      OR: [
        { status: "PENDING" },
        { status: "RETRY", nextAttemptAt: { lte: now } },
        { status: "SENDING", updatedAt: { lt: new Date(now.getTime() - 10 * 60_000) } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(limit, 20)),
    include: { version: { include: { event: { include: { tickers: { select: { stockCode: true } } } } } } },
  });
  let sent = 0, failed = 0;
  for (const job of jobs) {
    if (!job.version) continue;
    const version = job.version;
    if (version.createdAt < settings.enabledAt ||
        !isAlertEligible(version.priority, version.status, settings.minimumPriority as AlertPriority, settings.includePreliminary)) {
      await prisma.discordAlertDelivery.updateMany({
        where: { id: job.id, status: job.status, updatedAt: job.updatedAt },
        data: { status: "SKIPPED", lastError: "Not eligible under current alert configuration" },
      });
      continue;
    }
    const claimed = await prisma.discordAlertDelivery.updateMany({
      where: { id: job.id, status: job.status, updatedAt: job.updatedAt },
      data: { status: "SENDING", attempts: { increment: 1 } },
    });
    if (claimed.count !== 1) continue;
    const outcome = await sendDiscordEmbed(eventEmbed({
      title: version.title, summary: version.summary, category: version.event.category,
      priority: version.priority, status: version.status, changeType: version.changeType,
      sourceUrl: version.sourceUrl, eventId: version.eventId,
      codes: [...new Set(version.event.tickers.map((ticker) => ticker.stockCode))],
    }));
    if (outcome.ok) {
      sent++;
      await prisma.discordAlertDelivery.update({ where: { id: job.id }, data: { status: "SENT", sentAt: new Date(), lastError: null } });
    } else {
      failed++;
      const permanent = outcome.permanent || job.attempts + 1 >= MAX_ATTEMPTS;
      const delay = nextRetryDelayMs(job.attempts + 1, outcome.retryAfterMs);
      await prisma.discordAlertDelivery.update({
        where: { id: job.id },
        data: {
          status: permanent ? "FAILED" : "RETRY",
          lastError: outcome.error.slice(0, 300),
          nextAttemptAt: new Date(Date.now() + delay),
        },
      });
    }
  }
  return { sent, failed };
}

/** Never allow a Discord failure to change the research scan's reported outcome. */
export async function processDiscordAlerts(): Promise<void> {
  if (!discordWebhookConfigured()) return;
  try {
    await syncDiscordOutbox();
    await dispatchDiscordOutbox();
  } catch (error) {
    console.error("[alerts] delivery pass failed:", error instanceof Error ? error.message : "unknown");
  }
}

export async function sendDiscordTest() {
  if (!discordWebhookConfigured()) throw new Error("Configure DISCORD_WEBHOOK_URL in Vercel first.");
  const recent = await prisma.discordAlertDelivery.findFirst({
    where: { kind: "TEST", createdAt: { gte: new Date(Date.now() - 60_000) } },
    select: { id: true },
  });
  if (recent) throw new Error("Wait at least 60 seconds between test messages.");
  const log = await prisma.discordAlertDelivery.create({
    data: { kind: "TEST", destination: DESTINATION, status: "SENDING", attempts: 1 },
  });
  const outcome = await sendDiscordEmbed({
    title: "IDX Terminal · Discord connection successful",
    description: "This is an admin-initiated test, not a market alert. Automatic alerts use verified corporate intelligence events.",
    color: 0x38bdf8,
    footer: { text: "IDX Terminal · Test notification" },
    timestamp: new Date().toISOString(),
  });
  await prisma.discordAlertDelivery.update({
    where: { id: log.id },
    data: { status: outcome.ok ? "SENT" : "FAILED", sentAt: outcome.ok ? new Date() : null, lastError: outcome.ok ? null : outcome.error },
  });
  return outcome.ok ? { ok: true as const } : { ok: false as const, error: outcome.error };
}

export async function retryDiscordAlerts() {
  await prisma.discordAlertDelivery.updateMany({
    where: { kind: "EVENT", status: { in: ["RETRY", "FAILED"] } },
    data: { status: "RETRY", attempts: 0, nextAttemptAt: new Date() },
  });
  await syncDiscordOutbox();
  return dispatchDiscordOutbox();
}

export async function getAlertDashboard() {
  const [settings, logs] = await Promise.all([
    getAlertSettings(),
    prisma.discordAlertDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { version: { select: { title: true, priority: true, eventId: true } } },
    }),
  ]);
  return {
    settings: {
      enabled: settings.enabled,
      minimumPriority: settings.minimumPriority,
      includePreliminary: settings.includePreliminary,
      enabledAt: settings.enabledAt.toISOString(),
      marketDigestEnabled: settings.marketDigestEnabled,
      priceLimitsEnabled: settings.priceLimitsEnabled,
      marketTopCount: settings.marketTopCount,
    },
    deliveries: logs.map((log) => ({
      id: log.id, kind: log.kind, status: log.status, attempts: log.attempts,
      createdAt: log.createdAt.toISOString(), sentAt: log.sentAt?.toISOString() ?? null,
      nextAttemptAt: log.nextAttemptAt.toISOString(), lastError: log.lastError,
      title: log.version?.title ?? log.displayTitle ?? "Test message", priority: log.version?.priority ?? null,
      eventId: log.version?.eventId ?? null,
    })),
  };
}
