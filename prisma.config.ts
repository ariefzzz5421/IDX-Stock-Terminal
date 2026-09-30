import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // This config is exclusively for the local SQLite path. Production
    // Postgres migrations use prisma.supabase.config.ts and DIRECT_URL.
    url: process.env["SQLITE_DATABASE_URL"] || "file:./prisma/dev.db",
  },
});
