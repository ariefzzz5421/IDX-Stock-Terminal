-- CreateTable
CREATE TABLE "intelligence_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" DATETIME,
    "effectiveAt" DATETIME,
    "lastChangedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latestVersion" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "intelligence_event_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "announcementAt" DATETIME,
    "effectiveAt" DATETIME,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "intelligence_event_versions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "intelligence_events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "intelligence_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "publishedAt" DATETIME,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error" TEXT,
    CONSTRAINT "intelligence_sources_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "intelligence_events" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "intelligence_sources_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "intelligence_event_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "intelligence_tickers" (
    "eventId" TEXT NOT NULL,
    "stockCode" TEXT NOT NULL,
    "securityCode" TEXT NOT NULL,
    "securityType" TEXT NOT NULL DEFAULT 'STOCK',

    PRIMARY KEY ("eventId", "securityCode"),
    CONSTRAINT "intelligence_tickers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "intelligence_events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "intelligence_tickers_stockCode_fkey" FOREIGN KEY ("stockCode") REFERENCES "stocks" ("code") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "research_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slot" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "leaseExpiresAt" DATETIME NOT NULL,
    "cursorJson" TEXT NOT NULL DEFAULT '{}',
    "sourcesChecked" INTEGER NOT NULL DEFAULT 0,
    "newEvents" INTEGER NOT NULL DEFAULT 0,
    "updatedEvents" INTEGER NOT NULL DEFAULT 0,
    "failedAdapters" INTEGER NOT NULL DEFAULT 0,
    "aiInputTokens" INTEGER NOT NULL DEFAULT 0,
    "aiOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "errorLog" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "research_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    CONSTRAINT "research_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "research_notifications_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "intelligence_event_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
