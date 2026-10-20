import { marketStatus, jakartaNow } from "../market-session";
import { indicativeLimitStatus } from "../market-data/limit-status";
import { jakartaDate, marketCapText, rupiah } from "./market-rules";

export type IntradayStock = {
  code: string; name: string; lastPrice: number | null; volume: number;
  marketCap: number | null; changePct: number | null;
  turnover?: number | null; logoUrl?: string | null; capSource?: string;
};
export type MarketIssuerRow = IntradayStock & {tradedValue:number | null;valueSource:"reported"|"estimated"|"unavailable"};
export type IntradaySignal = {
  kind: "MARKET_VOLUME" | "MARKET_ARA" | "MARKET_ARB";
  key: string; title: string; embed: Record<string, unknown>;
  rows: MarketIssuerRow[];
};
export type IntradayOptions = {
  now: Date; fetchedAt: string | null; stocks: IntradayStock[];
  volumeEnabled: boolean; araEnabled: boolean; arbEnabled: boolean;
  marketTopCount: number; holidays?: string[]; preview?: boolean;
};

// The fetch timestamp is the time *our server observed* the delayed scanner, not an exchange tick.
export function intradaySlot(now: Date, fetchedAt: string | null, holidays: string[] = []) {
  const date = jakartaDate(now);
  const clock = jakartaNow(now);
  const market = marketStatus(now);
  if (!market.isOpen || holidays.includes(date)) return null;
  if (!fetchedAt) return null;
  const sourceAge = now.getTime() - Date.parse(fetchedAt);
  if (!Number.isFinite(sourceAge) || sourceAge < -60_000 || sourceAge > 180_000) return null;
  const minuteOfHour = clock.minute % 60;
  // The scheduler runs hourly at :00 (volume) and :10 (ARA / ARB), starting 10:00 WIB.
  // Accept a short delay from systemd AccuracySec / outbound request latency,
  // but never send at :05, :15, or any other off-slot minute.
  const volumeDue = clock.hour >= 10 && minuteOfHour < 3;
  const limitsDue = clock.hour >= 10 && minuteOfHour >= 10 && minuteOfHour < 13;
  if (!volumeDue && !limitsDue) return null;
  const hour = Math.floor(clock.minutes / 60);
  const bucket = volumeDue ? "00" : "10";
  const key = String(hour).padStart(2, "0") + ":" + bucket;
  return { date, key, hourly: volumeDue, limitsDue, market: market.label, observedAt: fetchedAt };
}

function validRow(s: IntradayStock) {
  return /^[A-Z0-9]{4,6}$/.test(s.code) && s.lastPrice !== null &&
    Number.isFinite(s.lastPrice) && s.lastPrice > 0 &&
    s.changePct !== null && Number.isFinite(s.changePct) &&
    Number.isFinite(s.volume) && s.volume > 0;
}
function changeText(pct: number): string {
  return (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
}
function compactVolume(shares: number): string {
  return new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(shares);
}
export function tradedValueFor(stock: IntradayStock): {value:number|null; source:"reported"|"estimated"|"unavailable"} {
  if(stock.turnover !== undefined && stock.turnover !== null && Number.isFinite(stock.turnover) && stock.turnover > 0)
    return {value:stock.turnover,source:"reported"};
  if(stock.lastPrice !== null && Number.isFinite(stock.lastPrice) && stock.lastPrice>0 &&
     Number.isFinite(stock.volume) && stock.volume>0 && Number.isFinite(stock.lastPrice*stock.volume))
    return {value:stock.lastPrice*stock.volume,source:"estimated"};
  return {value:null,source:"unavailable"};
}
function marketRows(items:IntradayStock[]):MarketIssuerRow[] {
  return items.map(s=>{
    const traded=tradedValueFor(s);
    return {...s,tradedValue:traded.value,valueSource:traded.source};
  });
}
function footer(observedAt: string): string {
  const observed = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit",
  }).format(new Date(observedAt));
  return "TradingView scanner · delayed/indicative · observed " + observed + " WIB · Not live tick data";
}
export const IDX_TERMINAL_MARKET_URL = "https://idx-stock-terminal.vercel.app/market";

/**
 * Keep each issuer's three lines together and separate issuers with one
 * blank line. Discord's embed fields are intentionally avoided so Session
 * and Source retain their own spacing on narrow mobile screens.
 */
export function issuerDescription(rows: MarketIssuerRow[]): string {
  return rows.map((r,i) => {
    const valueLabel = r.valueSource === "reported" ? "Value" : "Est. Value";
    return (i + 1) + ". **" + r.code + "** · " + rupiah(r.lastPrice) +
      " · " + changeText(r.changePct ?? 0) +
      "\nVol " + compactVolume(r.volume) + " shares · " + valueLabel + " " + marketCapText(r.tradedValue) +
      "\nMCap " + marketCapText(r.marketCap);
  }).join("\n\n");
}

function baseEmbed(title: string, color: number, description: string, observedAt: string, date: string) {
  // IDX Terminal is the report link; footer still clearly credits TradingView
  // as the delayed market-data scanner, never as an official BEI live feed.
  const spacedDescription = description +
    "\n\n**Session**\n" + date + " WIB" +
    "\n\n**Source**\n[IDX Terminal](" + IDX_TERMINAL_MARKET_URL + ")";
  return {
    title, description: spacedDescription.slice(0, 4096), color,
    url: IDX_TERMINAL_MARKET_URL,
    footer: { text: footer(observedAt) },
    timestamp: observedAt,
  };
}
export function buildIntradaySignals(options: IntradayOptions): IntradaySignal[] {
  const slot = options.preview ? {date: jakartaDate(options.now), key: "PREVIEW", hourly: true, limitsDue: true,
    market: "Preview", observedAt: options.fetchedAt ?? options.now.toISOString()} :
    intradaySlot(options.now, options.fetchedAt, options.holidays);
  if (!slot || options.stocks.length < 50) return [];
  const filtered = options.stocks.filter(validRow);
  if (filtered.length < 50) return [];
  const count = options.marketTopCount === 5 ? 5 : 10;
  const signals: IntradaySignal[] = [];
  if (options.volumeEnabled && slot.hourly) {
    const top = marketRows([...filtered].sort((a, b) => b.volume - a.volume || a.code.localeCompare(b.code)).slice(0,count));
    const description = issuerDescription(top);
    signals.push({kind:"MARKET_VOLUME",key:"market:"+slot.date+":"+slot.key+":VOLUME",
      title:(options.preview ? "PREVIEW · " : "")+"Top "+count+" Volume · "+slot.key+" WIB",
      rows:top,
      embed: {...baseEmbed((options.preview ? "PREVIEW ONLY · " : "")+"IDX · TOP "+count+" VOLUME · "+slot.key+" WIB",0x38bdf8,description,slot.observedAt,slot.date),_marketRows:top}});
  }
  if (slot.limitsDue && (options.araEnabled || options.arbEnabled)) {
    const limits = filtered.map(row => ({...row,limit:indicativeLimitStatus(row.code,row.lastPrice,row.changePct)}))
      .filter(row=>row.limit!==null);
    for(const [side,enabled,color] of [
      ["ARA",options.araEnabled,0x22c55e],["ARB",options.arbEnabled,0xef4444]
    ] as const) {
      if(!enabled) continue;
      const top = marketRows(limits.filter(s=>s.limit === side+"_INDICATIVE")
        .sort((a,b)=>side==="ARA"?b.volume-a.volume:a.volume-b.volume).slice(0,count));
      if (!top.length) continue; // no fabricated ARA/ARB events
      const description = issuerDescription(top);
      signals.push({kind:"MARKET_"+side as "MARKET_ARA"|"MARKET_ARB",
        key:"market:"+slot.date+":"+slot.key+":"+side,
        title:(options.preview ? "PREVIEW · " : "")+"Top "+count+" "+side+" (indicative) · "+slot.key+" WIB",
        rows:top,
        embed:{...baseEmbed((options.preview ? "PREVIEW ONLY · " : "")+"IDX · TOP "+count+" "+side+" (INDICATIVE) · "+slot.key+" WIB",
          color,description,slot.observedAt,slot.date),_marketRows:top}});
    }
  }
  return signals;
}
