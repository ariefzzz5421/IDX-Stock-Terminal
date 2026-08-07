import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` runs on postinstall and only reads the schema, but the
    // config still wants a syntactically valid URL. CI and fresh clones have no
    // DATABASE_URL yet, so fall back to a placeholder that is never connected
    // to — migrate/seed/studio all fail loudly if it is ever actually used.
    url:
      process.env["DATABASE_URL"] ??
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
