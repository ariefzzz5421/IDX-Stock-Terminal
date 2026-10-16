ALTER TABLE "discord_alert_settings" ADD COLUMN "marketDigestEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "discord_alert_settings" ADD COLUMN "priceLimitsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "discord_alert_settings" ADD COLUMN "marketTopCount" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "discord_alert_deliveries" ADD COLUMN "marketKey" TEXT;
ALTER TABLE "discord_alert_deliveries" ADD COLUMN "payloadJson" TEXT;
ALTER TABLE "discord_alert_deliveries" ADD COLUMN "displayTitle" TEXT;
CREATE UNIQUE INDEX "discord_alert_deliveries_marketKey_key" ON "discord_alert_deliveries"("marketKey");
