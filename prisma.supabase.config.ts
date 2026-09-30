import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.DIRECT_URL;
if (!url && process.env.NODE_ENV !== "production") {
  console.warn("DIRECT_URL is required for Supabase migrations.");
}

export default defineConfig({
  schema: "prisma/supabase/schema.prisma",
  migrations: { path: "prisma/supabase/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: url ?? "postgresql://unconfigured:unconfigured@localhost:5432/unconfigured" },
});
