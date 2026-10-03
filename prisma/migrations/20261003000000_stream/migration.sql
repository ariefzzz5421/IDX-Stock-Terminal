CREATE TABLE "stream_posts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "author_id" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'status',
  "body" TEXT NOT NULL,
  "tickers" TEXT NOT NULL DEFAULT '[]',
  "photo_data" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stream_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "stream_posts_created_at_idx" ON "stream_posts"("created_at" DESC);
CREATE INDEX "stream_posts_author_id_created_at_idx" ON "stream_posts"("author_id", "created_at" DESC);

CREATE TABLE "stream_comments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "post_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stream_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "stream_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "stream_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "stream_comments_post_id_created_at_idx" ON "stream_comments"("post_id", "created_at" DESC);

CREATE TABLE "stream_likes" (
  "post_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("post_id", "user_id"),
  CONSTRAINT "stream_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "stream_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "stream_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "stream_likes_user_id_idx" ON "stream_likes"("user_id");
