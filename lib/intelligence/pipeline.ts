import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { COMPANY_CATALOG } from "@/lib/company-catalog";
import { ensureStockCatalog } from "@/lib/stocks";
import { analyzeDocument } from "./openai";
import { changeType, calculateDilution, deriveRunStatus, eventIdentity, matchTickers, scoreMateriality, sha } from "./core";
import { discoverKsei, fetchSourceDocument, KSEI_FEEDS, type DiscoveredDocument } from "./sources";

const MAX_DOCUMENTS_PER_RUN = 10;
const LEASE_MS = 4 * 60_000;
const knownTickers = new Set(COMPANY_CATALOG.map((stock) => stock.code));
type ScanOptions = { dryRun: boolean; scheduled: boolean };
type ScanOutcome = { status: string; newEvents: number; updatedEvents: number; sourcesChecked: number; failedAdapters: number; errors: string[]; pending: number };

export const SOURCE_GAPS = [
  "IDX Keterbukaan Informasi dan pengumuman pengawasan BEI: belum ada feed publik yang tervalidasi untuk otomasi; pengumuman dapat terlewat.",
  "OJK dan pengumuman emiten: belum ada feed terstruktur terhubung.",
  "MSCI, FTSE Russell, VanEck GDX/GDXJ: belum ada adapter pengumuman resmi terhubung; perubahan indeks dan arus ETF tidak diklaim tercakup.",
  "Katalog saham biasa mencakup emiten tersimpan; daftar lengkap seri warrant belum tersinkronisasi dari BEI.",
  "KSEI jadwal bonus saham bukan pemecahan saham. Stock split dan kategori korporasi lain menunggu adapter resmi tersendiri.",
];

function jakartaDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

async function acquireLease() {
  const now = new Date();
  const owner = randomUUID();
  await prisma.researchRun.upsert({
    where: { id: "research-lock" },
    create: { id: "research-lock", slot: "LOCK", status: "IDLE", leaseExpiresAt: new Date(0) },
    update: {},
  });
  const claimed = await prisma.researchRun.updateMany({
    where: { id: "research-lock", OR: [{ status: { not: "RUNNING" } }, { leaseExpiresAt: { lt: now } }] },
    data: { status: "RUNNING", leaseExpiresAt: new Date(now.getTime() + LEASE_MS), cursorJson: owner },
  });
  return claimed.count === 1 ? owner : null;
}

async function recordDocument(document: DiscoveredDocument, text: string, fingerprint: string, dryRun: boolean) {
  if (!dryRun) await prisma.intelligenceSource.upsert({
    where: { sourceDocumentId: document.sourceDocumentId },
    create: {
      sourceDocumentId: document.sourceDocumentId, adapter: document.adapter, sourceUrl: document.sourceUrl,
      host: new URL(document.sourceUrl).hostname, title: document.title, status: "AVAILABLE",
      contentFingerprint: fingerprint, excerpt: text.slice(0, 18_000), publishedAt: document.publishedAt,
    },
    update: { sourceUrl: document.sourceUrl, title: document.title, status: "AVAILABLE", contentFingerprint: fingerprint, excerpt: text.slice(0, 18_000), lastCheckedAt: new Date(), error: null },
  });
}

async function processDocument(document: DiscoveredDocument, dryRun: boolean): Promise<{ kind: "NEW" | "UPDATED" | "UNCHANGED" | "SKIPPED"; inputTokens: number; outputTokens: number }> {
  const cached = await prisma.intelligenceSource.findUnique({ where: { sourceDocumentId: document.sourceDocumentId }, select: { sourceUrl: true, status: true, contentFingerprint: true, versionId: true, lastCheckedAt: true } });
  if (cached?.sourceUrl === document.sourceUrl && cached.contentFingerprint && (cached.versionId || cached.status === "NO_MATCH" || cached.status === "UNCONFIRMED") && Date.now() - cached.lastCheckedAt.getTime() < 6 * 60 * 60_000) {
    return { kind: "UNCHANGED", inputTokens: 0, outputTokens: 0 };
  }
  let source: { text: string; fingerprint: string };
  try { source = await fetchSourceDocument(document); }
  catch (error) {
    if (!dryRun) await prisma.intelligenceSource.upsert({
      where: { sourceDocumentId: document.sourceDocumentId },
      create: { sourceDocumentId: document.sourceDocumentId, adapter: document.adapter, sourceUrl: document.sourceUrl, host: new URL(document.sourceUrl).hostname, title: document.title, status: "UNAVAILABLE", publishedAt: document.publishedAt, error: String(error).slice(0, 500) },
      update: { status: "UNAVAILABLE", error: String(error).slice(0, 500), lastCheckedAt: new Date() },
    });
    throw error;
  }
  if (cached?.contentFingerprint === source.fingerprint && (cached.versionId || cached.status === "NO_MATCH" || cached.status === "UNCONFIRMED")) {
    if (!dryRun) await prisma.intelligenceSource.update({ where: { sourceDocumentId: document.sourceDocumentId }, data: { status: cached.status, lastCheckedAt: new Date(), error: null } });
    return { kind: "UNCHANGED", inputTokens: 0, outputTokens: 0 };
  }
  await recordDocument(document, source.text, source.fingerprint, dryRun);
  const matches = matchTickers(`${document.title} ${source.text.slice(0, 1000)}`, knownTickers);
  const primary = matches.find((ticker) => document.title.toUpperCase().includes(`(${ticker})`)) ?? matches[0];
  if (!primary) {
    if (!dryRun) await prisma.intelligenceSource.update({ where: { sourceDocumentId: document.sourceDocumentId }, data: { status: "NO_MATCH" } });
    return { kind: "SKIPPED", inputTokens: 0, outputTokens: 0 };
  }
  const identity = eventIdentity(primary, document.category, source.text, document.publishedAt, document.sourceDocumentId);
  const eventId = sha(identity).slice(0, 32);
  const previous = await prisma.intelligenceEvent.findUnique({ where: { id: eventId }, include: { versions: { orderBy: { eventVersion: "desc" }, take: 1 } } });
  const result = await analyzeDocument({ text: source.text, ticker: primary, category: document.category, sourceUrl: document.sourceUrl, previousSummary: previous?.summary });
  const research = result.research;
  const stock = COMPANY_CATALOG.find((item) => item.code === primary);
  const dilutionPct = research.newShares != null && research.existingShares != null ? calculateDilution(research.existingShares, research.newShares) : null;
  const score = scoreMateriality({
    transactionIdr: research.transactionIdr, marketCapIdr: stock?.marketCap ?? null, dilutionPct,
    changesControl: research.changesControl, leverageConcern: research.leverageConcern,
    indexRebalance: research.indexRebalance, governanceConcern: research.governanceConcern,
    officialEvidence: true, genuinelyNew: !previous,
  });
  const facts = {
    ticker: primary, category: research.category, status: research.status, phase: research.phase,
    transactionIdr: research.transactionIdr, newShares: research.newShares,
    existingShares: research.existingShares, exercisePriceIdr: research.exercisePriceIdr,
    announcementDate: research.announcementDate, effectiveDate: research.effectiveDate,
    evidence: research.evidence,
    dilutionPct,
  };
  const factsJson = JSON.stringify(facts);
  const delta = changeType(previous?.versions[0] ? { status: previous.versions[0].status as typeof research.status, contentFingerprint: previous.versions[0].contentFingerprint, factsJson: previous.versions[0].factsJson } : null,
    { status: research.status, contentFingerprint: source.fingerprint, factsJson });
  if (!delta) {
    if (!dryRun && previous) await prisma.intelligenceEvent.update({ where: { id: eventId }, data: { lastCheckedAt: new Date() } });
    return { kind: "UNCHANGED", inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  }
  if (research.status === "UNCONFIRMED") {
    if (!dryRun) await prisma.intelligenceSource.update({ where: { sourceDocumentId: document.sourceDocumentId }, data: { status: "UNCONFIRMED" } });
    return { kind: "SKIPPED", inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  }
  if (dryRun) return { kind: previous ? "UPDATED" : "NEW", inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  const effectiveAt = research.effectiveDate && !Number.isNaN(new Date(research.effectiveDate).getTime()) ? new Date(research.effectiveDate) : null;
  const announcementAt = research.announcementDate && !Number.isNaN(new Date(research.announcementDate).getTime()) ? new Date(research.announcementDate) : document.publishedAt;
  const analysisJson = JSON.stringify({
    whatChanged: research.whatChanged, materiality: research.materiality, issuerImpact: research.issuerImpact,
    marketImpact: research.marketImpact, uncertainty: research.uncertainty, dilution: research.dilution,
    liquidity: research.liquidity, debt: research.debt, ownership: research.ownership, monitorNext: research.monitorNext,
    scoreReasons: score.reasons,
  });
  const securityCodes = new Set([primary]);
  for (const match of source.text.matchAll(new RegExp(`\\b${primary}-[RW][0-9]?\\b`, "g"))) securityCodes.add(match[0]);
  await prisma.$transaction(async (tx) => {
    const now = new Date();
    await tx.intelligenceEvent.upsert({
      where: { id: eventId },
      create: { id: eventId, identity, category: research.category, title: research.title, priority: score.priority, status: research.status, direction: research.direction, score: score.score, summary: research.summary, firstSeenAt: now, publishedAt: now, effectiveAt, lastChangedAt: now, lastCheckedAt: now, latestVersion: 1 },
      update: { title: research.title, priority: score.priority, status: research.status, direction: research.direction, score: score.score, summary: research.summary, publishedAt: now, effectiveAt, lastChangedAt: now, lastCheckedAt: now, latestVersion: (previous?.latestVersion ?? 0) + 1 },
    });
    const version = await tx.intelligenceEventVersion.create({
      data: { eventId, eventVersion: (previous?.latestVersion ?? 0) + 1, previousVersionId: previous?.versions[0]?.id ?? null,
        contentFingerprint: source.fingerprint, changeType: delta, sourceUrl: document.sourceUrl, sourceDocumentId: document.sourceDocumentId,
        status: research.status, priority: score.priority, direction: research.direction, score: score.score,
        title: research.title, summary: research.summary, factsJson, analysisJson, announcementAt, effectiveAt },
    });
    await tx.intelligenceSource.update({ where: { sourceDocumentId: document.sourceDocumentId }, data: { eventId, versionId: version.id } });
    for (const securityCode of securityCodes) await tx.intelligenceTicker.upsert({
      where: { eventId_securityCode: { eventId, securityCode } },
      create: { eventId, stockCode: primary, securityCode, securityType: securityCode === primary ? "STOCK" : securityCode.includes("-R") ? "RIGHT" : "WARRANT" },
      update: {},
    });
  });
  return { kind: previous ? "UPDATED" : "NEW", inputTokens: result.inputTokens, outputTokens: result.outputTokens };
}

export async function runResearch(options: ScanOptions): Promise<ScanOutcome> {
  const owner = await acquireLease();
  if (!owner) throw new Error("A research scan is already running");
  const now = new Date();
  const slot = options.scheduled ? `scheduled:${jakartaDay(now)}` : `manual:${now.toISOString()}:${randomUUID()}`;
  let run: { id: string };
  try {
    run = await prisma.researchRun.create({ data: { slot, status: "RUNNING", dryRun: options.dryRun, leaseExpiresAt: new Date(now.getTime() + LEASE_MS) } });
  } catch (error) {
    await prisma.researchRun.updateMany({ where: { id: "research-lock", cursorJson: owner }, data: { status: "IDLE" } });
    throw error;
  }
  const errors: string[] = [];
  let newEvents = 0, updatedEvents = 0, sourcesChecked = 0, failedAdapters = 0, inputTokens = 0, outputTokens = 0;
  let pending: DiscoveredDocument[] = [];
  try {
    const deadline = Date.now() + 170_000;
    await ensureStockCatalog();
    const results = [];
    for (let i = 0; i < KSEI_FEEDS.length; i += 2) {
      results.push(...await Promise.all(KSEI_FEEDS.slice(i, i + 2).map(discoverKsei)));
      if (i + 2 < KSEI_FEEDS.length) await new Promise((resolve) => setTimeout(resolve, 400));
    }
    for (const result of results) {
      if (result.error) { failedAdapters++; errors.push(`${result.adapter}: ${result.error}`); }
      else pending.push(...result.documents);
    }
    const previousRun = await prisma.researchRun.findFirst({ where: { status: "PARTIAL", dryRun: false, NOT: { id: run.id } }, orderBy: { startedAt: "desc" }, select: { cursorJson: true } });
    if (previousRun) {
      try { const cursor = JSON.parse(previousRun.cursorJson) as { pending?: DiscoveredDocument[] }; pending.unshift(...(cursor.pending ?? []).map((d) => ({ ...d, publishedAt: d.publishedAt ? new Date(d.publishedAt) : null }))); } catch { /* Corrupt cursor is visible in run errors below. */ }
    }
    pending = [...new Map(pending.map((d) => [d.sourceDocumentId, d])).values()];
    const batch = pending.splice(0, MAX_DOCUMENTS_PER_RUN);
    for (let index = 0; index < batch.length; index++) {
      const document = batch[index];
      if (Date.now() > deadline) {
        pending.unshift(...batch.slice(index));
        errors.push("Batas waktu scan tercapai; dokumen sisanya disimpan untuk run berikutnya.");
        break;
      }
      sourcesChecked++;
      try {
        const result = await processDocument(document, options.dryRun);
        if (result.kind === "NEW") newEvents++;
        if (result.kind === "UPDATED") updatedEvents++;
        inputTokens += result.inputTokens;
        outputTokens += result.outputTokens;
      } catch (error) {
        errors.push(`${document.sourceDocumentId}: ${error instanceof Error ? error.message : String(error)}`);
        pending.push(document);
      }
    }
    const status = deriveRunStatus({ failedAdapters, errors: errors.length, pending: pending.length, sourceAdapters: KSEI_FEEDS.length, successfulAdapters: KSEI_FEEDS.length - failedAdapters });
    await prisma.researchRun.update({ where: { id: run.id }, data: {
      status, endedAt: new Date(), cursorJson: JSON.stringify({ pending }),
      sourcesChecked, newEvents, updatedEvents, failedAdapters, aiInputTokens: inputTokens, aiOutputTokens: outputTokens,
      errorLog: JSON.stringify(errors.slice(0, 50)),
    } });
    return { status, newEvents, updatedEvents, sourcesChecked, failedAdapters, errors, pending: pending.length };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    await prisma.researchRun.update({ where: { id: run.id }, data: { status: "FAILED", endedAt: new Date(), errorLog: JSON.stringify(errors.slice(0, 50)), cursorJson: JSON.stringify({ pending }), sourcesChecked, newEvents, updatedEvents, failedAdapters } });
    return { status: "FAILED", newEvents, updatedEvents, sourcesChecked, failedAdapters, errors, pending: pending.length };
  } finally {
    await prisma.researchRun.updateMany({ where: { id: "research-lock", cursorJson: owner }, data: { status: "IDLE", leaseExpiresAt: new Date(0) } });
  }
}
