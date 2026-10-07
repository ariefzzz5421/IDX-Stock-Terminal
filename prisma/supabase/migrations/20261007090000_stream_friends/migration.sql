CREATE TABLE "stream_friendships" (
  "id" TEXT NOT NULL,
  "user_a_id" TEXT NOT NULL,
  "user_b_id" TEXT NOT NULL,
  "requested_by_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stream_friendships_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "stream_friendships_user_a_id_user_b_id_key" ON "stream_friendships"("user_a_id", "user_b_id");
CREATE INDEX "stream_friendships_user_a_id_status_idx" ON "stream_friendships"("user_a_id", "status");
CREATE INDEX "stream_friendships_user_b_id_status_idx" ON "stream_friendships"("user_b_id", "status");
ALTER TABLE "stream_friendships" ADD CONSTRAINT "stream_friendships_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stream_friendships" ADD CONSTRAINT "stream_friendships_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stream_friendships" ADD CONSTRAINT "stream_friendships_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
