import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { needsLegacyBaseline } from "./ensure-supabase-baseline.mjs";

function run(bin, args) {
  const result = spawnSync(process.execPath, [resolve(bin), ...args], { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Production needs the same schema as the code before traffic moves to a new
// deployment. A failed migration fails the build and leaves the old site live.
if (process.env.VERCEL_ENV === "production") {
  if (!process.env.DIRECT_URL) {
    console.error("DIRECT_URL is required for the production database migration.");
    process.exit(1);
  }
  if (await needsLegacyBaseline(process.env.DIRECT_URL)) {
    console.log("Verified legacy Supabase schema; recording the initial migration baseline.");
    run("node_modules/prisma/build/index.js", ["migrate", "resolve", "--applied", "20260930_init", "--config", "prisma.supabase.config.ts"]);
  }
  run("node_modules/prisma/build/index.js", ["migrate", "deploy", "--config", "prisma.supabase.config.ts"]);
}

run("node_modules/next/dist/bin/next", ["build"]);
