-- CreateTable
CREATE TABLE "intelligence_events" (
    "id" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "effectiveAt" TIMESTAMP(3),
    "lastChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latestVersion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "intelligence_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intelligence_event_versions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL,
    "previousVersionId" TEXT,
    "contentFingerprint" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "factsJson" TEXT NOT NULL,
    "analysisJson" TEXT NOT NULL,
    "announcementAt" TIMESTAMP(3),
    "effectiveAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intelligence_event_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intelligence_sources" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "eventId" TEXT,
    "versionId" TEXT,
    "adapter" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "contentFingerprint" TEXT,
    "excerpt" TEXT,
    "publishedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error" TEXT,

    CONSTRAINT "intelligence_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intelligence_tickers" (
    "eventId" TEXT NOT NULL,
    "stockCode" TEXT NOT NULL,
    "securityCode" TEXT NOT NULL,
    "securityType" TEXT NOT NULL DEFAULT 'STOCK',

    CONSTRAINT "intelligence_tickers_pkey" PRIMARY KEY ("eventId","securityCode")
);

-- CreateTable
CREATE TABLE "research_runs" (
    "id" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "leaseExpiresAt" TIMESTAMP(3) NOT NULL,
    "cursorJson" TEXT NOT NULL DEFAULT '{}',
    "sourcesChecked" INTEGER NOT NULL DEFAULT 0,
    "newEvents" INTEGER NOT NULL DEFAULT 0,
    "updatedEvents" INTEGER NOT NULL DEFAULT 0,
    "failedAdapters" INTEGER NOT NULL DEFAULT 0,
    "aiInputTokens" INTEGER NOT NULL DEFAULT 0,
    "aiOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "errorLog" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "research_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "research_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "intelligence_events_identity_key" ON "intelligence_events"("identity");

-- CreateIndex
CREATE INDEX "intelligence_events_publishedAt_idx" ON "intelligence_events"("publishedAt" DESC);

-- CreateIndex
CREATE INDEX "intelligence_events_category_priority_status_idx" ON "intelligence_events"("category", "priority", "status");

-- CreateIndex
CREATE INDEX "intelligence_event_versions_publishedAt_idx" ON "intelligence_event_versions"("publishedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "intelligence_event_versions_eventId_eventVersion_key" ON "intelligence_event_versions"("eventId", "eventVersion");

-- CreateIndex
CREATE UNIQUE INDEX "intelligence_sources_sourceDocumentId_key" ON "intelligence_sources"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "intelligence_sources_adapter_publishedAt_idx" ON "intelligence_sources"("adapter", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "intelligence_tickers_stockCode_idx" ON "intelligence_tickers"("stockCode");

-- CreateIndex
CREATE UNIQUE INDEX "research_runs_slot_key" ON "research_runs"("slot");

-- CreateIndex
CREATE INDEX "research_runs_startedAt_idx" ON "research_runs"("startedAt" DESC);

-- CreateIndex
CREATE INDEX "research_runs_status_startedAt_idx" ON "research_runs"("status", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "research_notifications_userId_readAt_idx" ON "research_notifications"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "research_notifications_userId_versionId_key" ON "research_notifications"("userId", "versionId");

-- AddForeignKey
ALTER TABLE "intelligence_event_versions" ADD CONSTRAINT "intelligence_event_versions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "intelligence_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intelligence_sources" ADD CONSTRAINT "intelligence_sources_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "intelligence_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intelligence_sources" ADD CONSTRAINT "intelligence_sources_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "intelligence_event_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intelligence_tickers" ADD CONSTRAINT "intelligence_tickers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "intelligence_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intelligence_tickers" ADD CONSTRAINT "intelligence_tickers_stockCode_fkey" FOREIGN KEY ("stockCode") REFERENCES "stocks"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_notifications" ADD CONSTRAINT "research_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_notifications" ADD CONSTRAINT "research_notifications_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "intelligence_event_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
