-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "profiles" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "display_name" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "stock_code" TEXT NOT NULL,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "watchlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "watchlists_stock_code_fkey" FOREIGN KEY ("stock_code") REFERENCES "stocks" ("code") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stocks" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "market_cap" REAL,
    "logo_url" TEXT,
    "last_price" REAL,
    "prev_close" REAL,
    "last_change_pct" REAL,
    "last_volume" REAL,
    "last_value" REAL,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stock_code" TEXT NOT NULL,
    "interval" TEXT NOT NULL DEFAULT '1m',
    "timestamp" DATETIME NOT NULL,
    "open" REAL NOT NULL,
    "high" REAL NOT NULL,
    "low" REAL NOT NULL,
    "close" REAL NOT NULL,
    "volume" REAL NOT NULL,
    CONSTRAINT "price_history_stock_code_fkey" FOREIGN KEY ("stock_code") REFERENCES "stocks" ("code") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "published_at" DATETIME NOT NULL,
    "related_codes" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "watchlists_user_id_sort_order_idx" ON "watchlists"("user_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "watchlists_user_id_stock_code_key" ON "watchlists"("user_id", "stock_code");

-- CreateIndex
CREATE INDEX "stocks_last_change_pct_idx" ON "stocks"("last_change_pct");

-- CreateIndex
CREATE INDEX "stocks_market_cap_idx" ON "stocks"("market_cap");

-- CreateIndex
CREATE INDEX "price_history_stock_code_interval_timestamp_idx" ON "price_history"("stock_code", "interval", "timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "price_history_stock_code_interval_timestamp_key" ON "price_history"("stock_code", "interval", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "news_url_key" ON "news"("url");

-- CreateIndex
CREATE INDEX "news_published_at_idx" ON "news"("published_at" DESC);
