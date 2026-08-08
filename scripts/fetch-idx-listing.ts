/**
 * Refreshes the committed IDX security catalogue from two public market
 * sources:
 *
 * - KSEI is authoritative for the active IDX equity universe and the monthly
 *   local/foreign ownership snapshot.
 * - TradingView supplies the issuer logo, current IDX-IC-style sector labels,
 *   and market capitalisation where it covers the ticker.
 * - Yahoo fills a few display names and market caps that TradingView misses.
 *
 * Run with: npm run catalog:refresh
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { CURATED_SECTORS } from "../lib/market-data/sectors";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133 Safari/537.36";
const KSEI_ARCHIVE = "https://web.ksei.co.id/archive_download/master_securities";
const TRADINGVIEW_SCANNER = "https://scanner.tradingview.com/indonesia/scan";
const PAGE_SIZE = 250;
const SHARE_CLASS_LOGO_ALIAS: Record<string, string> = {
  CNTB: "CNTX",
  GOTOM: "GOTO",
  MAMIP: "MAMI",
  MYRXP: "MYRX",
  SQBI: "SCPI",
};

type YahooEntry = {
  code: string;
  name: string;
  marketCap: number | null;
};

type TradingViewEntry = {
  code: string;
  name: string | null;
  logoId: string | null;
  marketCap: number | null;
  sector: string | null;
  industry: string | null;
};

export type ListingEntry = {
  code: string;
  name: string;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  logoUrl: string | null;
  listingDate: string | null;
  listedShares: number | null;
  localHoldingPct: number | null;
  foreignHoldingPct: number | null;
  recordedHoldingPct: number | null;
  holdingsDate: string;
  closingPrice: number | null;
};

function numberOrNull(value: string | number | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isoDate(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(`${value} 00:00:00 UTC`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function cleanKseiName(value: string): string {
  const smallWords = new Set(["and", "of"]);
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (word === "tbk") return "Tbk";
      if (word === "pt") return "PT";
      if (index > 0 && smallWords.has(word)) return word;
      return `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchKseiRows() {
  const archiveResponse = await fetch(KSEI_ARCHIVE, {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  if (!archiveResponse.ok) {
    throw new Error(`KSEI archive returned ${archiveResponse.status}`);
  }

  const html = await archiveResponse.text();
  const filename = html.match(/StatisEfek\d{8}\.txt\.zip/)?.[0];
  if (!filename) throw new Error("KSEI archive did not expose a master-file link.");

  const zipResponse = await fetch(`https://web.ksei.co.id/Download/${filename}`, {
    headers: { "User-Agent": UA, Accept: "application/zip" },
  });
  if (!zipResponse.ok) {
    throw new Error(`KSEI master file returned ${zipResponse.status}`);
  }

  const archive = unzipSync(new Uint8Array(await zipResponse.arrayBuffer()));
  const textFile = Object.entries(archive).find(([name]) => name.endsWith(".txt"));
  if (!textFile) throw new Error("KSEI master archive contained no text file.");

  const lines = strFromU8(textFile[1]).replace(/^\uFEFF/, "").split(/\r?\n/);
  const headers = lines.shift()?.split("|") ?? [];
  const rows = lines.flatMap((line) => {
    if (!line.trim()) return [];
    const values = line.split("|");
    return [Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))];
  });

  return rows.filter(
    (row) =>
      row.Type === "EQUITY" &&
      row.Status === "ACTIVE" &&
      row["Stock Exchange"] === "IDX",
  );
}

async function fetchTradingView() {
  const columns = [
    "name",
    "description",
    "logoid",
    "market_cap_basic",
    "sector",
    "industry",
  ];
  const response = await fetch(TRADINGVIEW_SCANNER, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({
      filter: [{ left: "exchange", operation: "equal", right: "IDX" }],
      options: { lang: "en" },
      markets: ["indonesia"],
      symbols: { query: { types: [] }, tickers: [] },
      columns,
      range: [0, 9999],
    }),
  });
  if (!response.ok) {
    throw new Error(`TradingView scanner returned ${response.status}`);
  }

  const body = (await response.json()) as {
    data?: Array<{ d?: unknown[] }>;
  };

  return new Map(
    (body.data ?? []).flatMap((row): Array<[string, TradingViewEntry]> => {
      const [code, name, logoId, marketCap, sector, industry] = row.d ?? [];
      if (typeof code !== "string") return [];
      const entry: TradingViewEntry = {
        code,
        name: typeof name === "string" ? name : null,
        logoId: typeof logoId === "string" ? logoId : null,
        marketCap: numberOrNull(marketCap as number),
        sector: typeof sector === "string" ? sector : null,
        industry: typeof industry === "string" ? industry : null,
      };
      return [[code, entry]];
    }),
  );
}

async function fetchInvezgoLogoFallbacks(codes: string[]) {
  const logos = new Map<string, string>();
  const batchSize = 16;
  for (let index = 0; index < codes.length; index += batchSize) {
    const batch = codes.slice(index, index + batchSize);
    const settled = await Promise.allSettled(
      batch.map(async (code) => {
        const url = `https://storage.invezgo.com/icon/${code}.png`;
        const response = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA } });
        if (response.ok && response.headers.get("content-type")?.startsWith("image/")) {
          logos.set(code, url);
        }
      }),
    );
    void settled;
  }
  return logos;
}

type ScreenerQuote = {
  symbol?: string;
  longName?: string;
  shortName?: string;
  marketCap?: number;
};

async function yahooAuth() {
  const seed = await fetch("https://fc.yahoo.com", { headers: { "User-Agent": UA } });
  const cookie = seed.headers
    .getSetCookie()
    .map((item) => item.split(";")[0])
    .join("; ");
  if (!cookie) throw new Error("Yahoo did not return a session cookie.");

  const crumbResponse = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": UA, Cookie: cookie },
  });
  const crumb = (await crumbResponse.text()).trim();
  if (!crumb || crumb.includes("<")) throw new Error("Yahoo did not return a crumb.");
  return { cookie, crumb };
}

async function fetchYahoo() {
  const auth = await yahooAuth();
  const entries = new Map<string, YahooEntry>();
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
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
          query: { operator: "and", operands: [{ operator: "eq", operands: ["exchange", "JKT"] }] },
          userId: "",
          userIdType: "guid",
        }),
      },
    );
    if (!response.ok) throw new Error(`Yahoo screener returned ${response.status}`);

    const body = (await response.json()) as {
      finance?: { result?: Array<{ total?: number; quotes?: ScreenerQuote[] }> };
    };
    const result = body.finance?.result?.[0];
    total = result?.total ?? 0;

    for (const quote of result?.quotes ?? []) {
      const code = quote.symbol?.replace(/\.JK$/i, "").toUpperCase();
      if (!code) continue;
      entries.set(code, {
        code,
        name: (quote.longName ?? quote.shortName ?? code).replace(/\s+/g, " ").trim(),
        marketCap: numberOrNull(quote.marketCap),
      });
    }
    offset += PAGE_SIZE;
  }

  return entries;
}

async function main() {
  console.log("Fetching the latest KSEI equity master...");
  const kseiRows = await fetchKseiRows();

  console.log("Fetching company logos and sectors...");
  const [tradingView, yahoo] = await Promise.all([fetchTradingView(), fetchYahoo()]);
  const invezgoLogos = await fetchInvezgoLogoFallbacks(
    kseiRows
      .map((row) => row.Code.toUpperCase())
      .filter((code) => !tradingView.get(code)?.logoId),
  );

  const logoFor = (code: string) => {
    const tv = tradingView.get(code);
    if (tv?.logoId) return `https://s3-symbol-logo.tradingview.com/${tv.logoId}--big.svg`;
    const direct = invezgoLogos.get(code);
    if (direct) return direct;
    const alias = SHARE_CLASS_LOGO_ALIAS[code];
    if (!alias) return null;
    const aliasTv = tradingView.get(alias);
    return aliasTv?.logoId
      ? `https://s3-symbol-logo.tradingview.com/${aliasTv.logoId}--big.svg`
      : invezgoLogos.get(alias) ?? `https://storage.invezgo.com/icon/${alias}.png`;
  };

  const listing = kseiRows
    .map((row): ListingEntry => {
      const code = row.Code.toUpperCase();
      const tv = tradingView.get(code);
      const yh = yahoo.get(code);
      const listedShares = numberOrNull(row["Num. of Sec"]);
      const closingPrice = numberOrNull(row["Closing Price"]);
      const derivedMarketCap =
        listedShares != null && closingPrice != null ? listedShares * closingPrice : null;

      return {
        code,
        name: yh?.name ?? tv?.name ?? cleanKseiName(row.Description || row.Issuer || code),
        sector: CURATED_SECTORS[code] ?? tv?.sector ?? row.Sector ?? null,
        industry: tv?.industry ?? row.Sector ?? null,
        marketCap: tv?.marketCap ?? yh?.marketCap ?? derivedMarketCap,
        logoUrl: logoFor(code),
        listingDate: isoDate(row["Listing Date"]),
        listedShares,
        localHoldingPct: numberOrNull(row["Local (%)"]),
        foreignHoldingPct: numberOrNull(row["Foreign (%)"]),
        recordedHoldingPct: numberOrNull(row["Total (%)"]),
        holdingsDate: isoDate(row.Date) ?? row.Date,
        closingPrice,
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  const outputPath = path.join(process.cwd(), "prisma", "idx-listing.json");
  await writeFile(outputPath, `${JSON.stringify(listing, null, 2)}\n`, "utf8");

  const logoCount = listing.filter((entry) => entry.logoUrl).length;
  const newVsYahoo = listing.filter((entry) => !yahoo.has(entry.code)).length;
  console.log(
    `Wrote ${listing.length} active IDX equity securities (${logoCount} logos, ` +
      `${newVsYahoo} securities missing from Yahoo).`,
  );
}

main().catch((error) => {
  console.error("Failed to refresh the IDX catalogue:", error);
  process.exit(1);
});
