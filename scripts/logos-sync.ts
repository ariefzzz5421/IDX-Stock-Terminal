/**
 * Scans public/logos/ and folds every image found into data/logo-overrides.json.
 *
 *   npm run logos:sync
 *
 * Drop BBCA.png into public/logos/, run this, commit both files. Remote URLs
 * added to the JSON by hand are preserved — this only adds and updates entries
 * whose file actually exists on disk.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const LOGO_DIR = path.join(process.cwd(), "public", "logos");
const OVERRIDES = path.join(process.cwd(), "data", "logo-overrides.json");
const EXTENSIONS = new Set([".svg", ".png", ".webp", ".jpg", ".jpeg"]);

if (!existsSync(LOGO_DIR)) {
  console.error(`Missing ${LOGO_DIR}. Create it and drop logo files in.`);
  process.exit(1);
}

const existing = existsSync(OVERRIDES)
  ? (JSON.parse(readFileSync(OVERRIDES, "utf8")) as Record<string, string>)
  : {};

const found: Record<string, string> = {};
const skipped: string[] = [];

for (const file of readdirSync(LOGO_DIR)) {
  const ext = path.extname(file).toLowerCase();
  if (!EXTENSIONS.has(ext)) continue;

  const ticker = path.basename(file, ext).toUpperCase();

  // IDX codes are 4 letters; anything else is probably a stray file.
  if (!/^[A-Z]{3,5}$/.test(ticker)) {
    skipped.push(file);
    continue;
  }

  found[ticker] = `/logos/${file}`;
}

const merged: Record<string, string> = { ...existing, ...found };

// Keep comments first, then tickers alphabetically, so diffs stay readable.
const ordered: Record<string, string> = {};
for (const key of Object.keys(merged).filter((k) => k.startsWith("_"))) {
  ordered[key] = merged[key];
}
for (const key of Object.keys(merged).filter((k) => !k.startsWith("_")).sort()) {
  ordered[key] = merged[key];
}

writeFileSync(OVERRIDES, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");

const localCount = Object.keys(found).length;
const remoteCount =
  Object.keys(ordered).filter((k) => !k.startsWith("_")).length - localCount;

console.log(`Scanned ${LOGO_DIR}`);
console.log(`  local files : ${localCount}`);
console.log(`  remote URLs : ${remoteCount}`);
if (skipped.length) {
  console.log(`  skipped     : ${skipped.join(", ")} (name must be the ticker)`);
}
console.log(`\nWrote data/logo-overrides.json — commit it along with the images.`);
