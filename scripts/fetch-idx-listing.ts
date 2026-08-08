/**
 * Pulls every equity listed on the Jakarta exchange from Yahoo Finance and
 * writes prisma/idx-listing.json, which the seed reads.
 *
 *   npx tsx scripts/fetch-idx-listing.ts
 *
 * Committed output means a fresh clone gets the full board without needing
 * network access. Re-run it when the board changes — new listings, delistings,
 * ticker renames.
 *
 * Yahoo's screener requires a cookie plus a matching "crumb" token, so the
 * first two requests exist purely to obtain those.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { CURATED_SECTORS } from "../lib/market-data/sectors";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

/** Yahoo caps the screener at 250 rows per request. */
const PAGE_SIZE = 250;

type ScreenerQuote = {
  symbol?: string;
  longName?: string;
  shortName?: string;
  marketCap?: number;
};

export type ListingEntry = {
  code: string;
  name: string;
  sector: string | null;
  marketCap: number | null;
};

async function authenticate() {
  const seed = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": UA },
  });

  const cookie = (seed.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .join("; ");

  if (!cookie) throw new Error("Yahoo did not return a session cookie.");

  const crumbResponse = await fetch(
    "https://query1.finance.yahoo.com/v1/test/getcrumb",
    { headers: { "User-Agent": UA, Cookie: cookie } },
  );
  const crumb = (await crumbResponse.text()).trim();

  if (!crumb || crumb.includes("<")) {
    throw new Error(`Yahoo did not return a crumb (got: ${crumb.slice(0, 60)})`);
  }

  return { cookie, crumb };
}

async function fetchPage(
  auth: { cookie: string; crumb: string },
  offset: number,
) {
  const response = await fetch(
    `https://query2.finance.yahoo.com/v1/finance/screener?crumb=${encodeURIComponent(auth.crumb)}&lang=en-US&region=US`,
    {
      method: "POST",
      headers: {
        "User-Agent": UA,
        Cookie: auth.cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        size: PAGE_SIZE,
        offset,
        sortField: "dayvolume",
        sortType: "desc",
        quoteType: "equity",
        query: {
          operator: "and",
          operands: [{ operator: "eq", operands: ["exchange", "JKT"] }],
        },
        userId: "",
        userIdType: "guid",
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Screener returned ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as {
    finance?: {
      result?: Array<{ total?: number; quotes?: ScreenerQuote[] }>;
      error?: { description?: string };
    };
  };

  if (body.finance?.error) {
    throw new Error(`Screener error: ${body.finance.error.description}`);
  }

  const result = body.finance?.result?.[0];
  return { total: result?.total ?? 0, quotes: result?.quotes ?? [] };
}

/** "PT Bank Central Asia Tbk" reads better than "BANK CENTRAL ASIA T". */
function cleanName(quote: ScreenerQuote, code: string): string {
  const name = quote.longName ?? quote.shortName ?? code;
  return name.replace(/\s+/g, " ").trim();
}

async function main() {
  console.log("Authenticating with Yahoo Finance...");
  const auth = await authenticate();

  const entries = new Map<string, ListingEntry>();
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const page = await fetchPage(auth, offset);
    total = page.total;

    for (const quote of page.quotes) {
      // Symbols arrive suffixed for the exchange: BBCA.JK
      const code = quote.symbol?.replace(/\.JK$/i, "").toUpperCase();
      if (!code || !/^[A-Z]{3,5}$/.test(code)) continue;

      entries.set(code, {
        code,
        name: cleanName(quote, code),
        sector: CURATED_SECTORS[code] ?? null,
        marketCap: quote.marketCap ?? null,
      });
    }

    offset += PAGE_SIZE;
    console.log(`  ${Math.min(offset, total)} / ${total}`);

    // Be a considerate guest on a free endpoint.
    if (offset < total) await new Promise((r) => setTimeout(r, 400));
  }

  const listing = [...entries.values()].sort((a, b) =>
    a.code.localeCompare(b.code),
  );

  const withSector = listing.filter((e) => e.sector).length;
  const outputPath = path.join(process.cwd(), "prisma", "idx-listing.json");

  await writeFile(outputPath, `${JSON.stringify(listing, null, 2)}\n`, "utf8");

  console.log(
    `\nWrote ${listing.length} tickers to prisma/idx-listing.json ` +
      `(${withSector} with a curated sector).`,
  );
}

main().catch((error) => {
  console.error("Failed to fetch the IDX listing:", error);
  process.exit(1);
});
