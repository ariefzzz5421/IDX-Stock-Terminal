import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getLatestIdxStockSummary } from "@/lib/market-data/idx-official";
import { getMarketActivity } from "@/lib/market-data/trending";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { sendDiscordEmbed } from "./discord";
import { getAlertSettings, discordWebhookConfigured } from "./store";
import { buildMarketSignals, type Cap, type MarketMode } from "./market-rules";
import { nextRetryDelayMs } from "./rules";

export { buildMarketSignals } from "./market-rules";

async function marketSnapshot() {
  const [official, tradingView] = await Promise.all([getLatestIdxStockSummary(), getMarketActivity()]);
  if (!official.available || !official.date || !official.rows.length) {
    return { date: null, rows: [], lookup: {} as Record<string, Cap> };
  }
  const lookup: Record<string, Cap> = {};
  for (const stock of tradingView.allStocks) if (stock.marketCap != null && stock.marketCap > 0) {
    lookup[stock.code] = { value: stock.marketCap, source: "TradingView/cached catalog (may be delayed)" };
  }
  for (const row of official.rows) if (!lookup[row.code]) {
    const mcap = getCompanyCatalogEntry(row.code)?.marketCap;
    if (mcap != null && mcap > 0) lookup[row.code] = { value: mcap, source: "Stored issuer catalog (may be stale)" };
  }
  return { date: official.date, rows: official.rows, lookup };
}

export async function previewMarketEmbeds() {
  const snapshot = await marketSnapshot();
  if (!snapshot.date) return { date: null, source: "BEI", previews: [], message: "Official BEI market summary unavailable. No data invented." };
  const now = new Date();
  const signals = buildMarketSignals({
    ...snapshot, now, mode: "close", count: 5, digestEnabled: true,
    limitsEnabled: true, preview: true,
  });
  return {
    date: snapshot.date, source: "BEI Ringkasan Saham + market-cap estimates",
    previews: signals.slice(0, 4).map(signal => ({ type: signal.kind, title: signal.title, embed: signal.embed })),
    message: "PREVIEW ONLY — snapshot may be from a previous trading date. No Discord messages sent.",
  };
}

const RETRIES = 6;
export async function dispatchMarketDeliveries(limit=20) {
  const settings = await getAlertSettings();
  if (!settings.enabled || !discordWebhookConfigured()) return { sent: 0, failed: 0 };
  const now = new Date();
  const jobs = await prisma.discordAlertDelivery.findMany({
    where: {
      kind: { in: ["MARKET_DIGEST", "MARKET_LIMIT"] },
      OR: [
        { status: "PENDING" },
        { status: "RETRY", nextAttemptAt: { lte: now } },
        { status: "SENDING", updatedAt: { lt: new Date(now.getTime() - 10*60_000) } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(limit, 1), 30),
  });
  let sent = 0, failed = 0;
  for (const job of jobs) {
    // Do not flush unsent alerts when a feature has been disabled.
    if (!(job.kind === "MARKET_DIGEST" ? settings.marketDigestEnabled : settings.priceLimitsEnabled) ||
        job.createdAt < settings.enabledAt) {
      await prisma.discordAlertDelivery.updateMany({
        where: { id: job.id, status: job.status, updatedAt: job.updatedAt },
        data: { status: "SKIPPED", lastError: "Feature disabled or alert cutoff reset" },
      });
      continue;
    }
    const claimed = await prisma.discordAlertDelivery.updateMany({
      where: { id: job.id, status: job.status, updatedAt: job.updatedAt },
      data: { status: "SENDING", attempts: { increment: 1 } },
    });
    if (claimed.count !== 1) continue;
    let outcome: Awaited<ReturnType<typeof sendDiscordEmbed>>;
    try {
      const embed = JSON.parse(job.payloadJson ?? "null") as Record<string, unknown> | null;
      outcome = embed ? await sendDiscordEmbed(embed, "market") :
        { ok: false, error: "Missing persisted market embed", permanent: true, retryAfterMs: 0 };
    } catch {
      outcome = { ok: false, error: "Unreadable persisted embed", permanent: true, retryAfterMs: 0 };
    }
    if (outcome.ok) {
      sent++;
      await prisma.discordAlertDelivery.update({where:{id:job.id},data:{ status:"SENT",sentAt:new Date(),lastError:null }});
    } else {
      failed++;
      const permanent = outcome.permanent || job.attempts + 1 >= RETRIES;
      await prisma.discordAlertDelivery.update({where:{id:job.id},data:{
        status: permanent ? "FAILED" : "RETRY",
        lastError: outcome.error.slice(0,300),
        nextAttemptAt: new Date(Date.now()+nextRetryDelayMs(job.attempts+1,outcome.retryAfterMs)),
      }});
    }
  }
  return {sent,failed};
}

export async function runMarketAlerts(mode: MarketMode) {
  const settings = await getAlertSettings();
  if (!settings.enabled || !discordWebhookConfigured()) return {queued:0,sent:0,failed:0,message:"Alerts disabled or webhook missing"};
  if (!settings.marketDigestEnabled && !settings.priceLimitsEnabled) return {queued:0,sent:0,failed:0,message:"Market alerts disabled"};
  const snapshot = await marketSnapshot();
  if (!snapshot.date) return {queued:0,sent:0,failed:0,message:"Official BEI summary unavailable"};
  const signals = buildMarketSignals({
    ...snapshot, mode, now: new Date(), count: settings.marketTopCount,
    digestEnabled: settings.marketDigestEnabled, limitsEnabled: settings.priceLimitsEnabled,
  });
  for (const signal of signals) {
    await prisma.discordAlertDelivery.upsert({
      where: {marketKey:signal.key},
      create: {
        kind:signal.kind,destination:"discord:market",marketKey:signal.key,
        displayTitle:signal.title,payloadJson:JSON.stringify(signal.embed),status:"PENDING",
      },
      update: {},
    });
  }
  const result = await dispatchMarketDeliveries();
  return {queued:signals.length, ...result,message:signals.length?"Market signals processed":"No eligible same-day market signals"};
}

export async function runMarketAlertsSafely(mode:MarketMode) {
  try {return await runMarketAlerts(mode);}
  catch (error) {
    console.error("[market-alerts] scan failed", error instanceof Error ? error.message : "unknown");
    return {queued:0,sent:0,failed:0,message:"Market alert scan unavailable"};
  }
}

export async function retryMarketDeliveries() {
  await prisma.discordAlertDelivery.updateMany({
    where: {kind:{in:["MARKET_DIGEST","MARKET_LIMIT"]},status:{in:["RETRY","FAILED"]}},
    data: {status:"RETRY", attempts:0, nextAttemptAt:new Date()},
  });
  return dispatchMarketDeliveries();
}

export async function sendMarketPreviewTest() {
  const recent = await prisma.discordAlertDelivery.findFirst({
    where: {kind:"TEST",createdAt:{gte:new Date(Date.now()-60_000)}},
    select:{id:true},
  });
  if (recent) throw new Error("Wait at least 60 seconds between test messages.");
  const preview = await previewMarketEmbeds();
  const first = preview.previews.find(item => item.type === "MARKET_DIGEST") ?? preview.previews[0];
  if (!first) throw new Error("Market preview unavailable; check BEI data source.");
  const entry = await prisma.discordAlertDelivery.create({
    data: {kind:"TEST",destination:"discord:market",status:"SENDING",attempts:1,
      displayTitle:"Market preview test · " + (preview.date ?? "unknown date")},
  });
  const outcome = await sendDiscordEmbed(first.embed,"market");
  await prisma.discordAlertDelivery.update({
    where:{id:entry.id},
    data:{status:outcome.ok?"SENT":"FAILED",sentAt:outcome.ok?new Date():null,
      lastError:outcome.ok?null:outcome.error},
  });
  return outcome.ok ? {ok:true,date:preview.date} : {ok:false,error:outcome.error};
}
