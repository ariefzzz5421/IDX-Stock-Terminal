ALTER TABLE "discord_alert_settings" ADD COLUMN "marketVolumeEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "discord_alert_settings" ADD COLUMN "marketAraEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "discord_alert_settings" ADD COLUMN "marketArbEnabled" BOOLEAN NOT NULL DEFAULT true;
UPDATE "discord_alert_settings" SET "marketTopCount" = 10;
