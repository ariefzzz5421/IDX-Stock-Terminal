/**
 * Reports which tickers have no logo, and optionally verifies that the ones
 * they do have still load.
 *
 *   npm run logos:check              list tickers with no logo at all
 *   npm run logos:check -- --verify  also HEAD every URL and report dead ones
 *
 * Anything listed here renders as a monogram until you add a file to
 * public/logos/ or a URL to data/logo-overrides.json.
 */
import { COMPANY_CATALOG } from "../lib/company-catalog";
import { resolveLogo, manualLogoCount } from "../lib/logos";

async function main() {
  const verify = process.argv.includes("--verify");

  const missing: string[] = [];
  const remote: Array<{ code: string; url: string }> = [];

  for (const company of COMPANY_CATALOG) {
    const logo = resolveLogo(company.code, company.logoUrl);
    if (!logo) {
      missing.push(company.code);
      continue;
    }
    if (!logo.url.startsWith("/")) {
      remote.push({ code: company.code, url: logo.url });
    }
  }

  console.log(`Catalogue        : ${COMPANY_CATALOG.length} tickers`);
  console.log(`Manual overrides : ${manualLogoCount()}`);
  console.log(`No logo at all   : ${missing.length}`);

  if (missing.length) {
    console.log(`\nRendering as monograms:\n  ${missing.join(", ")}`);
    console.log(
      `\nTo fix: drop <TICKER>.png into public/logos/ and run \`npm run logos:sync\`,` +
        `\n        or add "TICKER": "https://..." to data/logo-overrides.json.`,
    );
  }

  if (!verify) {
    console.log(
      `\nPass --verify to also check that ${remote.length} remote URLs still load.`,
    );
    return;
  }

  console.log(`\nVerifying ${remote.length} remote URLs...`);

  const dead: string[] = [];
  const BATCH = 20;

  for (let index = 0; index < remote.length; index += BATCH) {
    const slice = remote.slice(index, index + BATCH);
    const results = await Promise.all(
      slice.map(async ({ code, url }) => {
        try {
          const response = await fetch(url, { method: "HEAD" });
          return response.ok ? null : code;
        } catch {
          return code;
        }
      }),
    );
    dead.push(...results.filter((code): code is string => code !== null));
    process.stdout.write(
      `  ${Math.min(index + BATCH, remote.length)} / ${remote.length}\r`,
    );
  }

  console.log(`\n\nBroken URLs      : ${dead.length}`);
  if (dead.length) {
    console.log(`  ${dead.join(", ")}`);
    console.log(
      `\nOverride any of these in data/logo-overrides.json to replace them.`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
