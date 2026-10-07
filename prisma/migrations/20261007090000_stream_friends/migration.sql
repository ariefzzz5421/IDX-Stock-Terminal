CREATE TABLE "stream_friendships" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_a_id" TEXT NOT NULL,
  "user_b_id" TEXT NOT NULL,
  "requested_by_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "stream_friendships_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "stream_friendships_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "stream_friendships_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "stream_friendships_user_a_id_user_b_id_key" ON "stream_friendships"("user_a_id", "user_b_id");
CREATE INDEX "stream_friendships_user_a_id_status_idx" ON "stream_friendships"("user_a_id", "status");
CREATE INDEX "stream_friendships_user_b_id_status_idx" ON "stream_friendships"("user_b_id", "status");
