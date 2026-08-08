import "server-only";

const IDX_ORIGIN = "https://www.idx.co.id";
const REQUEST_TIMEOUT_MS = 3_500;
const SUMMARY_CACHE_MS = 15 * 60_000;
const PROFILE_CACHE_MS = 24 * 60 * 60_000;

const BROWSER_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
  Referer: `${IDX_ORIGIN}/`,
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "X-Requested-With": "XMLHttpRequest",
};

export type IdxStockSummary = {
  code: string;
  name: string;
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  previous: number | null;
  change: number | null;
  volume: number | null;
  value: number | null;
  frequency: number | null;
  bid: number | null;
  bidVolume: number | null;
  offer: number | null;
  offerVolume: number | null;
  foreignBuy: number | null;
  foreignSell: number | null;
  foreignNet: number | null;
  listedShares: number | null;
  tradableShares: number | null;
};

export type IdxCompanyProfile = {
  businessActivity: string | null;
  address: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  listingDate: string | null;
  board: string | null;
  sector: string | null;
  subSector: string | null;
  industry: string | null;
  subIndustry: string | null;
  shareholders: Array<{
    name: string;
    shares: number | null;
    percentage: number | null;
  }>;
};

export type IdxSummaryResult = {
  available: boolean;
  date: string | null;
  rows: IdxStockSummary[];
};

type TimedValue<T> = { value: T; expiresAt: number };

const globalForIdx = globalThis as unknown as {
  idxCookiePromise?: Promise<string>;
  idxSummaryPromise?: Promise<IdxSummaryResult>;
  idxSummaryCache?: TimedValue<IdxSummaryResult>;
  idxProfileCache?: Map<string, TimedValue<IdxCompanyProfile | null>>;
};

function numeric(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function idxCookie() {
  globalForIdx.idxCookiePromise ??= (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${IDX_ORIGIN}/id`, {
        headers: BROWSER_HEADERS,
        cache: "no-store",
        signal: controller.signal,
      });
      await response.body?.cancel();
      return response.headers
        .getSetCookie()
        .map((cookie) => cookie.split(";")[0])
        .join("; ");
    } catch {
      return "";
    } finally {
      clearTimeout(timer);
    }
  })();
  const cookie = await globalForIdx.idxCookiePromise;
  if (!cookie) globalForIdx.idxCookiePromise = undefined;
  return cookie;
}

async function requestIdx(path: string): Promise<unknown> {
  const cookie = await idxCookie();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${IDX_ORIGIN}${path}`, {
      headers: { ...BROWSER_HEADERS, ...(cookie ? { Cookie: cookie } : {}) },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`IDX returned ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function jakartaTradingDateCandidates(limit = 6) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const cursor = new Date(Date.UTC(read("year"), read("month") - 1, read("day"), 12));
  const candidates: string[] = [];

  while (candidates.length < limit) {
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      candidates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return candidates;
}

function mapSummary(item: Record<string, unknown>): IdxStockSummary | null {
  const code = stringOrNull(item.StockCode)?.toUpperCase();
  if (!code) return null;
  const buy = numeric(item.ForeignBuy);
  const sell = numeric(item.ForeignSell);
  return {
    code,
    name: stringOrNull(item.StockName) ?? code,
    date: stringOrNull(item.Date) ?? "",
    open: numeric(item.OpenPrice),
    high: numeric(item.High),
    low: numeric(item.Low),
    close: numeric(item.Close),
    previous: numeric(item.Previous),
    change: numeric(item.Change),
    volume: numeric(item.Volume),
    value: numeric(item.Value),
    frequency: numeric(item.Frequency),
    bid: numeric(item.Bid),
    bidVolume: numeric(item.BidVolume),
    offer: numeric(item.Offer),
    offerVolume: numeric(item.OfferVolume),
    foreignBuy: buy,
    foreignSell: sell,
    foreignNet: buy != null && sell != null ? buy - sell : null,
    listedShares: numeric(item.ListedShares),
    tradableShares: numeric(item.TradebleShares),
  };
}

async function loadLatestSummary(): Promise<IdxSummaryResult> {
  for (const date of jakartaTradingDateCandidates()) {
    try {
      const body = (await requestIdx(
        `/primary/TradingSummary/GetStockSummary?date=${date.replaceAll("-", "")}&start=0&length=9999`,
      )) as { data?: Array<Record<string, unknown>> };
      const rows = (body.data ?? []).flatMap((item) => {
        const mapped = mapSummary(item);
        return mapped ? [mapped] : [];
      });
      if (rows.length) return { available: true, date, rows };
    } catch {
      // IDX periodically rejects automated requests. The caller renders an
      // explicit unavailable state instead of inventing a ranking.
      break;
    }
  }
  return { available: false, date: null, rows: [] };
}

export async function getLatestIdxStockSummary(): Promise<IdxSummaryResult> {
  const cached = globalForIdx.idxSummaryCache;
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  globalForIdx.idxSummaryPromise ??= loadLatestSummary()
    .then((value) => {
      globalForIdx.idxSummaryCache = {
        value,
        expiresAt: Date.now() + SUMMARY_CACHE_MS,
      };
      return value;
    })
    .finally(() => {
      globalForIdx.idxSummaryPromise = undefined;
    });

  return globalForIdx.idxSummaryPromise;
}

export async function getIdxCompanyProfile(
  code: string,
): Promise<IdxCompanyProfile | null> {
  const upper = code.toUpperCase();
  const cache = (globalForIdx.idxProfileCache ??= new Map());
  const cached = cache.get(upper);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let value: IdxCompanyProfile | null = null;
  try {
    const body = (await requestIdx(
      `/primary/ListedCompany/GetCompanyProfilesDetail?KodeEmiten=${encodeURIComponent(upper)}&language=id-id`,
    )) as {
      Profiles?: Array<Record<string, unknown>>;
      PemegangSaham?: Array<Record<string, unknown>>;
    };
    const profile = body.Profiles?.[0];
    if (profile) {
      value = {
        businessActivity: stringOrNull(profile.KegiatanUsahaUtama),
        address: stringOrNull(profile.Alamat),
        website: stringOrNull(profile.Website),
        email: stringOrNull(profile.Email),
        phone: stringOrNull(profile.Telepon),
        listingDate: stringOrNull(profile.TanggalPencatatan),
        board: stringOrNull(profile.PapanPencatatan),
        sector: stringOrNull(profile.Sektor),
        subSector: stringOrNull(profile.SubSektor),
        industry: stringOrNull(profile.Industri),
        subIndustry: stringOrNull(profile.SubIndustri),
        shareholders: (body.PemegangSaham ?? []).flatMap((holder) => {
          const name = stringOrNull(holder.Nama);
          return name
            ? [{ name, shares: numeric(holder.Jumlah), percentage: numeric(holder.Persentase) }]
            : [];
        }),
      };
    }
  } catch {
    value = null;
  }

  cache.set(upper, {
    value,
    expiresAt: Date.now() + (value ? PROFILE_CACHE_MS : SUMMARY_CACHE_MS),
  });
  return value;
}
