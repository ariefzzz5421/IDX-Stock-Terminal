import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Embedded SQLite, so this always resolves to something real and usable
    // even with no .env file at all — there is no external service to fail
    // to reach.
    url: process.env["DATABASE_URL"] || "file:./prisma/dev.db",
  },
});
