import { indicativeLimitStatus } from "../market-data/limit-status";

export type MarketMode = "close" | "limits";
export type MarketRow = {
  code: string; name: string; date: string;
  close: number | null; previous: number | null;
  volume: number | null; value: number | null;
  listedShares: number | null;
};
export type Cap = { value: number | null; source: string };
export type MarketSignal = {
  key: string; kind: "MARKET_DIGEST" | "MARKET_LIMIT" | "MARKET_CLOSE";
  title: string; embed: Record<string, unknown>;
};

export function jakartaDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? "00";
  return part("year") + "-" + part("month") + "-" + part("day");
}
export function jakartaClock(now: Date) {
  const pieces = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const get = (key: string) => pieces.find(x => x.type === key)?.value ?? "";
  return { day: get("weekday"), minute: Number(get("hour")) * 60 + Number(get("minute")) };
}
export function rupiah(value: number | null): string {
  if (value == null || !Number.isFinite(value) || value < 0) return "N/D";
  return "Rp" + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}
export function marketCapText(value: number | null): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "N/D";
  if (value >= 1e12) return "Rp" + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value / 1e12) + " T";
  if (value >= 1e9) return "Rp" + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value / 1e9) + " M";
  return rupiah(value);
}
/**
 * Shared Discord market-alert text format for Volume, ARA/ARB, Trending,
 * closing, and the optional BEI gainers/losers digests. Do not mix image
 * typography with Markdown: Discord descriptions cannot set a custom font.
 */
function idNumber(value:number,maximumFractionDigits=2):string {
  return new Intl.NumberFormat("id-ID",{maximumFractionDigits}).format(value);
}
function formattedMarketCap(value:number|null):string {
  if(value==null || !Number.isFinite(value) || value<=0)return "N/D";
  // These units follow the existing IDX Terminal IDR formatter:
  // T=triliun, M=miliar, without a redundant Rp prefix on the MCap line.
  return marketCapText(value).replace(/^Rp/,"").replace(/\s+([TM])$/,"$1");
}
function formattedTransactionValue(value:number|null):string {
  if(value==null || !Number.isFinite(value) || value<=0)return "N/D";
  return marketCapText(value).replace(/^Rp/,"Rp ");
}
function formattedShares(value:number|null):string {
  if(value==null || !Number.isFinite(value) || value<0)return "N/D";
  if(value>=1e9)return idNumber(value/1e9,1)+" M Shares";
  if(value>=1e6)return idNumber(value/1e6,1)+" Jt Shares";
  if(value>=1e3)return idNumber(value/1e3,1)+" Rb Shares";
  return idNumber(value,0)+" Shares";
}

export function discordIssuerHeadline(rank:number,code:string,price:number|null,changePct:number):string {
  const change=Number.isFinite(changePct)
    ?(changePct>=0?"+":"")+new Intl.NumberFormat("id-ID",{
      minimumFractionDigits:2,maximumFractionDigits:2,
    }).format(changePct)+"%"
    :"N/D";
  const ticker=code.replace(/[^A-Z0-9]/g,"").slice(0,6)||"N/D";
  const displayPrice=rupiah(price).replace(/^Rp/,"Rp ");
  return "**#"+rank+". "+ticker+"** | **"+displayPrice+"** | **"+change+"**";
}
export function discordIssuerRow(input:{
  rank:number;code:string;price:number|null;changePct:number;
  marketCap:number|null;tradedValue:number|null;volume:number|null;
  valueSource?:"reported"|"estimated"|"unavailable";
}):string {
  const qualifier=input.valueSource==="estimated"?" _(estimasi)_":"";
  return [
    discordIssuerHeadline(input.rank,input.code,input.price,input.changePct),
    "MCap | **"+formattedMarketCap(input.marketCap)+"**",
    "Volume Transaksi | **"+formattedTransactionValue(input.tradedValue)+"**"+qualifier,
    "Volume Shares | **"+formattedShares(input.volume)+"**",
  ].join("\n");
}

export function capForRow(row: MarketRow, lookup: Record<string, Cap>): Cap {
  if (row.listedShares != null && row.listedShares > 0 &&
      row.close != null && row.close > 0 && Number.isFinite(row.listedShares * row.close)) {
    return { value: row.listedShares * row.close, source: "BEI listed shares × close (estimate)" };
  }
  return lookup[row.code] ?? { value: null, source: "unavailable" };
}
function qualified(row: MarketRow, date: string): row is MarketRow & { close: number; previous: number } {
  return (!row.date || row.date.startsWith(date) || row.date.replace(/-/g, "").startsWith(date.replace(/-/g, ""))) && row.close != null && row.previous != null &&
    Number.isFinite(row.close) && Number.isFinite(row.previous) &&
    row.close > 0 && row.previous > 0 && row.volume != null && row.volume > 0;
}
export function marketCandidates(rows: MarketRow[], date: string, lookup: Record<string, Cap>, count: number) {
  const stocks = rows.filter(row => qualified(row, date))
    .map(row => ({ ...row, changePct: ((row.close! - row.previous!) / row.previous!) * 100,
      cap: capForRow(row, lookup) }));
  const gainers = stocks.filter(row => row.changePct > 0)
    .sort((a,b) => b.changePct - a.changePct || a.code.localeCompare(b.code)).slice(0,count);
  const losers = stocks.filter(row => row.changePct < 0)
    .sort((a,b) => a.changePct - b.changePct || a.code.localeCompare(b.code)).slice(0,count);
  const limits = stocks.flatMap(row => {
    const status = indicativeLimitStatus(row.code, row.close, row.changePct);
    return status ? [{...row,status}] : [];
  });
  return { stocks, gainers, losers, limits };
}
export function buildMarketSignals(args: {
  rows: MarketRow[]; date: string; lookup: Record<string, Cap>;
  now: Date; mode: MarketMode; count: number; digestEnabled: boolean; limitsEnabled: boolean;
  preview?: boolean;
}): MarketSignal[] {
  const { rows, date, lookup, now, mode, preview = false } = args;
  const clock = jakartaClock(now);
  // A real delivery never uses the last available trading day's prices as today's.
  if (!preview && (date !== jakartaDate(now) || clock.day === "Sat" || clock.day === "Sun")) return [];
  if (!preview && rows.length < 50) return []; // fail closed on partial/unavailable official summaries
  const closing = clock.minute >= 16 * 60 + 20;
  if (!preview && mode === "close" && !closing) return [];
  if (!preview && mode === "limits" && (clock.minute < 9 * 60 || clock.minute >= 22 * 60)) return [];
  const count = args.count === 10 ? 10 : 5;
  const { gainers, losers, limits } = marketCandidates(rows, date, lookup, count);
  const link = "https://idx-stock-terminal.vercel.app/market";
  const headline = preview ? "PREVIEW ONLY · " : "";
  const signals: MarketSignal[] = [];
  const formatRow = (r: (typeof gainers)[number],index:number) =>
    discordIssuerRow({
      rank:index+1,code:r.code,price:r.close,changePct:r.changePct,
      marketCap:r.cap.value,tradedValue:r.value,
      volume:r.volume,valueSource:r.value && r.value>0?"reported":"unavailable",
    });
  if (mode === "close" && args.digestEnabled) {
    for (const [type, items, color] of [
      ["GAINERS", gainers, 0x22c55e],
      ["LOSERS", losers, 0xef4444],
    ] as const) {
      if (!items.length) continue;
      signals.push({
        key: "market:" + date + ":" + type,
        kind: "MARKET_DIGEST",
        title: "IDX " + type + " · " + date,
        embed: {
          // When this official EOD digest is enabled, use the same premium
          // image renderer as hourly volume and indicative limit alerts.
          _marketRows: items.map(item => ({
            code:item.code, lastPrice:item.close,changePct:item.changePct,
            volume:item.volume ?? 0,marketCap:item.cap.value,
            tradedValue:item.value && item.value>0 ? item.value :
              item.close * (item.volume ?? 0),
            valueSource:item.value && item.value>0 ? "reported" : "estimated",
          })),
          title: headline + "IDX MARKET · TOP " + type,
          description: items.map((item,i) => formatRow(item,i)).join("\n\n").slice(0,4000),
          color, url: link,
          fields: [
            { name: "As of (BEI summary)", value: date, inline: true },
            { name: "Market cap", value: "BEI listed shares × close; fallback TradingView/catalog estimates", inline: false },
            { name: "Source", value: "BEI Ringkasan Saham · [IDX](https://www.idx.co.id/id/data-pasar/ringkasan-perdagangan/ringkasan-saham/)", inline: false },
          ],
          footer: {text:"End-of-day snapshot · NOT real-time · Not investment advice"},
          timestamp: now.toISOString(),
        },
      });
    }
  }
  if (args.limitsEnabled) for (const row of limits.slice(0, 30)) {
    const side = row.status === "ARA_INDICATIVE" ? "ARA" : "ARB";
    signals.push({
      key: "market:" + date + ":" + side + ":" + row.code,
      kind: "MARKET_LIMIT",
      title: row.code + " · " + side + " indicative",
      embed: {
        title: headline + (side === "ARA" ? "🟢" : "🔴") + " IDX PRICE LIMIT · " + row.code,
        description: "**INDICATIVE " + side + "** — calculated from dated BEI market summary, not exchange-confirmed status.",
        color: side === "ARA" ? 0x22c55e : 0xef4444,
        url: "https://idx-stock-terminal.vercel.app/asset/" + encodeURIComponent(row.code),
        fields: [
          { name: "Ticker", value: row.code, inline: true },
          { name: "Close / last reported", value: rupiah(row.close), inline: true },
          { name: "Change", value: (row.changePct > 0 ? "+" : "") + row.changePct.toFixed(2) + "%", inline: true },
          { name: "Previous close", value: rupiah(row.previous), inline: true },
          { name: "Market cap (estimate)", value: marketCapText(row.cap.value), inline: true },
          { name: "Market cap source", value: row.cap.source, inline: false },
          { name: "BEI summary date", value: date + " WIB · no per-tick timestamp", inline: false },
          { name: "Official source", value: "[BEI Ringkasan Saham](https://www.idx.co.id/id/data-pasar/ringkasan-perdagangan/ringkasan-saham/)", inline: false },
        ],
        footer: {text:"Indicative only · Limited board coverage · Price data may be delayed"},
        timestamp: now.toISOString(),
      },
    });
  }
  // EOD run includes price-limit cases as well; intraday route only enqueues limits.
  if (mode === "close" && args.limitsEnabled) {
    return signals;
  }
  return mode === "limits" ? signals.filter(x=>x.kind==="MARKET_LIMIT") : signals;
}
