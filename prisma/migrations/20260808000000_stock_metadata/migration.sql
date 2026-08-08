-- AlterTable
ALTER TABLE "stocks" ADD COLUMN     "market_cap" DOUBLE PRECISION,
ADD COLUMN     "logo_url" TEXT;

-- CreateIndex
CREATE INDEX "stocks_market_cap_idx" ON "stocks"("market_cap");
