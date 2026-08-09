import "server-only";

import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import {
  getIdxCompanyProfile,
  getLatestIdxStockSummary,
  type IdxStockSummary,
} from "./idx-official";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
const YAHOO_PROFILE_CACHE_MS = 30 * 60_000;

type YahooAuth = { cookie: string; crumb: string };
type RawNumber = { raw?: number } | number | null | undefined;
type RawString = string | null | undefined;

type YahooProfile = {
  summary: string | null;
  website: string | null;
  address: string | null;
  sector: string | null;
  industry: string | null;
  employees: number | null;
  bid: number | null;
  bidSize: number | null;
  offer: number | null;
  offerSize: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  week52High: number | null;
  week52Low: number | null;
  sharesOutstanding: number | null;
  floatShares: number | null;
  trailingPE: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  insiderHoldingPct: number | null;
  institutionHoldingPct: number | null;
};

export type CompanyDetails = {
  code: string;
  summary: string | null;
  website: string | null;
  address: string | null;
  sector: string | null;
  industry: string | null;
  listingDate: string | null;
  listingBoard: string | null;
  employees: number | null;
  quote: {
    open: number | null;
    high: number | null;
    low: number | null;
    week52High: number | null;
    week52Low: number | null;
    sharesOutstanding: number | null;
    floatShares: number | null;
    trailingPE: number | null;
    priceToBook: number | null;
    dividendYield: number | null;
  };
  orderBook: {
    bid: number | null;
    bidVolume: number | null;
    offer: number | null;
    offerVolume: number | null;
    asOf: string | null;
    source: "IDX" | "Yahoo" | null;
  };
  ownership: {
    localPct: number | null;
    foreignPct: number | null;
    recordedPct: number | null;
    unrecordedPct: number | null;
    insidersPct: number | null;
    institutionsPct: number | null;
    asOf: string | null;
  };
  majorShareholders: Array<{
    name: string;
    shares: number | null;
    percentage: number | null;
  }>;
  sources: string[];
};

type TimedProfile = { value: YahooProfile | null; expiresAt: number };
const globalForYahoo = globalThis as unknown as {
  yahooAuthPromise?: Promise<YahooAuth>;
  yahooProfileCache?: Map<string, TimedProfile>;
};

function rawNumber(value: RawNumber): number | null {
  const parsed = typeof value === "number" ? value : value?.raw;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
}

function text(value: RawString): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function yahooAuth(): Promise<YahooAuth> {
  globalForYahoo.yahooAuthPromise ??= (async () => {
    const seed = await fetch("https://fc.yahoo.com", {
      headers: { "User-Agent": UA },
      cache: "no-store",
    });
    const cookie = seed.headers
      .getSetCookie()
      .map((item) => item.split(";")[0])
      .join("; ");
    if (!cookie) throw new Error("Yahoo profile session unavailable.");
    const crumbResponse = await fetch(
      "https://query1.finance.yahoo.com/v1/test/getcrumb",
      { headers: { "User-Agent": UA, Cookie: cookie }, cache: "no-store" },
    );
    const crumb = (await crumbResponse.text()).trim();
    if (!crumb || crumb.includes("<")) throw new Error("Yahoo profile crumb unavailable.");
    return { cookie, crumb };
  })().catch((error) => {
    globalForYahoo.yahooAuthPromise = undefined;
    throw error;
  });
  return globalForYahoo.yahooAuthPromise;
}

async function getYahooProfile(code: string): Promise<YahooProfile | null> {
  const upper = code.toUpperCase();
  const cache = (globalForYahoo.yahooProfileCache ??= new Map());
  const cached = cache.get(upper);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let value: YahooProfile | null = null;
  try {
    const auth = await yahooAuth();
    const modules = [
      "assetProfile",
      "summaryDetail",
      "defaultKeyStatistics",
      "majorHoldersBreakdown",
    ].join(",");
    const url = new URL(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${upper}.JK`,
    );
    url.searchParams.set("modules", modules);
    url.searchParams.set("crumb", auth.crumb);
    const response = await fetch(url, {
      headers: { "User-Agent": UA, Cookie: auth.cookie, Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Yahoo profile returned ${response.status}`);

    const body = (await response.json()) as {
      quoteSummary?: {
        result?: Array<{
          assetProfile?: Record<string, unknown>;
          summaryDetail?: Record<string, RawNumber>;
          defaultKeyStatistics?: Record<string, RawNumber>;
          majorHoldersBreakdown?: Record<string, RawNumber>;
        }>;
      };
    };
    const result = body.quoteSummary?.result?.[0];
    if (result) {
      const profile = result.assetProfile ?? {};
      const summary = result.summaryDetail ?? {};
      const stats = result.defaultKeyStatistics ?? {};
      const holders = result.majorHoldersBreakdown ?? {};
      const address = [profile.address1, profile.address2, profile.city, profile.country]
        .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
        .join(", ");
      value = {
        summary: text(profile.longBusinessSummary as RawString),
        website: text(profile.website as RawString),
        address: address || null,
        sector: text(profile.sector as RawString),
        industry: text(profile.industry as RawString),
        employees: rawNumber(profile.fullTimeEmployees as RawNumber),
        bid: rawNumber(summary.bid),
        bidSize: rawNumber(summary.bidSize),
        offer: rawNumber(summary.ask),
        offerSize: rawNumber(summary.askSize),
        open: rawNumber(summary.open),
        high: rawNumber(summary.dayHigh),
        low: rawNumber(summary.dayLow),
        week52High: rawNumber(summary.fiftyTwoWeekHigh),
        week52Low: rawNumber(summary.fiftyTwoWeekLow),
        sharesOutstanding: rawNumber(stats.sharesOutstanding),
        floatShares: rawNumber(stats.floatShares),
        trailingPE: rawNumber(summary.trailingPE),
        priceToBook: rawNumber(stats.priceToBook),
        dividendYield: rawNumber(summary.dividendYield),
        insiderHoldingPct: rawNumber(holders.insidersPercentHeld),
        institutionHoldingPct: rawNumber(holders.institutionsPercentHeld),
      };
    }
  } catch {
    value = null;
  }

  cache.set(upper, { value, expiresAt: Date.now() + YAHOO_PROFILE_CACHE_MS });
  return value;
}

function bestOrderBook(
  idx: IdxStockSummary | null,
  yahoo: YahooProfile | null,
  idxDate: string | null,
): CompanyDetails["orderBook"] {
  if (idx && (idx.bid != null || idx.offer != null)) {
    return {
      bid: idx.bid,
      bidVolume: idx.bidVolume,
      offer: idx.offer,
      offerVolume: idx.offerVolume,
      asOf: idxDate,
      source: "IDX",
    };
  }
  if (yahoo && (yahoo.bid != null || yahoo.offer != null)) {
    return {
      bid: yahoo.bid,
      bidVolume: yahoo.bidSize,
      offer: yahoo.offer,
      offerVolume: yahoo.offerSize,
      asOf: null,
      source: "Yahoo",
    };
  }
  return { bid: null, bidVolume: null, offer: null, offerVolume: null, asOf: null, source: null };
}

export async function getCompanyDetails(code: string): Promise<CompanyDetails | null> {
  const upper = code.toUpperCase();
  const catalog = getCompanyCatalogEntry(upper);
  if (!catalog) return null;

  const [idxProfile, idxSummary, yahoo] = await Promise.all([
    getIdxCompanyProfile(upper),
    getLatestIdxStockSummary(),
    getYahooProfile(upper),
  ]);
  const idxQuote = idxSummary.rows.find((row) => row.code === upper) ?? null;
  const sources = [
    "KSEI ownership master",
    ...(idxProfile || idxQuote ? ["Indonesia Stock Exchange"] : []),
    ...(yahoo ? ["Yahoo Finance"] : []),
  ];
  const recorded = catalog.recordedHoldingPct;

  return {
    code: upper,
    summary: idxProfile?.businessActivity ?? yahoo?.summary ?? null,
    website: idxProfile?.website ?? yahoo?.website ?? null,
    address: idxProfile?.address ?? yahoo?.address ?? null,
    sector: idxProfile?.sector ?? catalog.sector ?? yahoo?.sector ?? null,
    industry: idxProfile?.industry ?? catalog.industry ?? yahoo?.industry ?? null,
    listingDate: idxProfile?.listingDate ?? catalog.listingDate,
    listingBoard: idxProfile?.board ?? null,
    employees: yahoo?.employees ?? null,
    quote: {
      open: idxQuote?.open ?? yahoo?.open ?? null,
      high: idxQuote?.high ?? yahoo?.high ?? null,
      low: idxQuote?.low ?? yahoo?.low ?? null,
      week52High: yahoo?.week52High ?? null,
      week52Low: yahoo?.week52Low ?? null,
      sharesOutstanding:
        yahoo?.sharesOutstanding ?? idxQuote?.listedShares ?? catalog.listedShares,
      floatShares: yahoo?.floatShares ?? idxQuote?.tradableShares ?? null,
      trailingPE: yahoo?.trailingPE ?? null,
      priceToBook: yahoo?.priceToBook ?? null,
      dividendYield: yahoo?.dividendYield ?? null,
    },
    orderBook: bestOrderBook(idxQuote, yahoo, idxSummary.date),
    ownership: {
      localPct: catalog.localHoldingPct,
      foreignPct: catalog.foreignHoldingPct,
      recordedPct: recorded,
      unrecordedPct: recorded == null ? null : Math.max(0, 100 - recorded),
      insidersPct: yahoo?.insiderHoldingPct == null ? null : yahoo.insiderHoldingPct * 100,
      institutionsPct:
        yahoo?.institutionHoldingPct == null ? null : yahoo.institutionHoldingPct * 100,
      asOf: catalog.holdingsDate,
    },
    majorShareholders: idxProfile?.shareholders ?? [],
    sources,
  };
}
