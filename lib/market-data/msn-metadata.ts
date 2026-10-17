import "server-only";

/**
 * Optional, metadata-only fallback. Identifier mapping from 0xrsydn/idx-cli
 * (MIT): pinned to commit 1adf6e4cec9134b4268f6f859a5c8a916cfff550.
 * Upstream GitHub is NOT a hosted intraday quote provider; MSN is unofficial
 * and may require a licensed/authorized key. Never use this for volume,
 * ranking, ARA/ARB, percentage changes, or session freshness.
 */
const MAP_URL =
  "https://raw.githubusercontent.com/0xrsydn/idx-cli/1adf6e4cec9134b4268f6f859a5c8a916cfff550/crates/idx-core/src/api/msn/symbol_ids.tsv";

export type MetadataCap = { marketCap: number; source: "MSN metadata (delayed, unverified timestamp)" };

export function parseSymbolIds(raw: string): Map<string,string> {
  const out = new Map<string,string>();
  for (const line of raw.split(/\r?\n/)) {
    const [ticker,id] = line.split("\t");
    if (/^[A-Z0-9]{4,6}$/.test(ticker ?? "") && /^[a-z0-9]{3,16}$/.test(id ?? ""))
      out.set(ticker,id);
  }
  return out;
}

export function parseMsnCaps(body: unknown, requested: Map<string,string>): Map<string,MetadataCap> {
  const result = new Map<string,MetadataCap>();
  if (!Array.isArray(body)) return result;
  const codesById = new Map([...requested].map(([ticker,id])=>[id,ticker]));
  for (const entry of body.slice(0,50)) {
    if (!entry || typeof entry !== "object") continue;
    const q = entry as {id?:unknown;instrumentId?:unknown;symbol?:unknown;marketCap?:unknown};
    const id = typeof q.id === "string" ? q.id : typeof q.instrumentId === "string" ? q.instrumentId : "";
    const ticker = codesById.get(id);
    const value = q.marketCap;
    if (ticker && typeof value === "number" && Number.isFinite(value) && value > 0 &&
        // Verify the identifier mapping and returned ticker agree if available.
        (typeof q.symbol !== "string" || q.symbol.toUpperCase().split(".")[0] === ticker)) {
      result.set(ticker,{marketCap:value,source:"MSN metadata (delayed, unverified timestamp)"});
    }
  }
  return result;
}

export async function fetchOptionalMsnMarketCaps(codes: string[]):Promise<Map<string,MetadataCap>> {
  const key = process.env.MSN_FINANCE_API_KEY?.trim();
  if (process.env.MSN_METADATA_FALLBACK_ENABLED !== "true" || !key) return new Map();
  try {
    const mappingResponse = await fetch(MAP_URL, {
      next: { revalidate: 86400 }, signal:AbortSignal.timeout(2500)
    });
    if (!mappingResponse.ok) return new Map();
    const mapping = parseSymbolIds(await mappingResponse.text());
    const requested = new Map(codes.slice(0,20).filter(code=>mapping.has(code))
      .map(code=>[code,mapping.get(code)!]));
    if (!requested.size) return new Map();
    const url = new URL("https://assets.msn.com/service/Finance/Quotes");
    url.searchParams.set("apikey",key);
    url.searchParams.set("ids",[...requested.values()].join(","));
    url.searchParams.set("wrapodata","false");
    const response = await fetch(url.toString(),{next:{revalidate:3600},signal:AbortSignal.timeout(4000)});
    if (!response.ok) return new Map();
    return parseMsnCaps(await response.json(),requested);
  } catch {
    // Fail closed and leave primary data untouched; never log MSN credentials.
    return new Map();
  }
}
