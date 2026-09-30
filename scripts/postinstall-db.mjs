import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL ?? "";
if (/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
  console.log("Supabase selected; skipping local SQLite setup during install.");
  process.exit(0);
}

const command = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(command, ["run", "db:setup"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
