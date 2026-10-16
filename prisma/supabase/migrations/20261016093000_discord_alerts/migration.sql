CREATE TABLE "discord_alert_settings" (
  "id" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "minimumPriority" TEXT NOT NULL DEFAULT 'HIGH',
  "includePreliminary" BOOLEAN NOT NULL DEFAULT false,
  "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "discord_alert_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "discord_alert_deliveries" (
  "id" TEXT NOT NULL,
  "versionId" TEXT,
  "destination" TEXT NOT NULL DEFAULT 'discord:primary',
  "kind" TEXT NOT NULL DEFAULT 'EVENT',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "discord_alert_deliveries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "discord_alert_deliveries_destination_versionId_key" ON "discord_alert_deliveries"("destination", "versionId");
CREATE INDEX "discord_alert_deliveries_status_nextAttemptAt_idx" ON "discord_alert_deliveries"("status", "nextAttemptAt");
CREATE INDEX "discord_alert_deliveries_createdAt_idx" ON "discord_alert_deliveries"("createdAt");
ALTER TABLE "discord_alert_deliveries" ADD CONSTRAINT "discord_alert_deliveries_versionId_fkey"
  FOREIGN KEY ("versionId") REFERENCES "intelligence_event_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
