import { marketStatus, jakartaNow } from "../market-session";
import type { TrendingStock } from "../market-data/trending";
import { jakartaDate } from "./market-rules";
import { issuerDescription, formattedTradingDate, tradedValueFor, IDX_TERMINAL_MARKET_URL, type MarketIssuerRow } from "./intraday-rules";

/** The site's Market Tape is getMarketActivity().byMarketCap.all: a
 * volume-of-shares ranking, NOT the separate IDR-turnover Top Volume alert.
 */
export function trendingSlot(now:Date, fetchedAt:string|null, holidays:string[]=[]){
  const clock=jakartaNow(now);
  const date=jakartaDate(now);
  if(!marketStatus(now).isOpen || holidays.includes(date) ||
     clock.hour<10 || clock.hour>15 || clock.minute<30 || clock.minute>32 ||
     !fetchedAt) return null;
  const age=now.getTime()-Date.parse(fetchedAt);
  if(!Number.isFinite(age) || age < -60_000 || age > 180_000) return null;
  return {date,key:String(clock.hour).padStart(2,"0")+":30"};
}
export function buildTrendingSignal(input:{
 now:Date;fetchedAt:string|null;stocks:TrendingStock[];holidays?:string[];preview?:boolean;
}) {
  const slot=input.preview?{date:jakartaDate(input.now),key:"PREVIEW"}:
    trendingSlot(input.now,input.fetchedAt,input.holidays);
  if(!slot) return null;
  // Source: EXACT same top-ten list as the user's Market Tape popup.
  // Ignore invalid rows instead of filling in missing market data.
  const top=input.stocks.slice(0,10).flatMap((s):MarketIssuerRow[]=>{
    if(!/^[A-Z0-9]{4,6}$/.test(s.code) ||
       s.lastPrice===null || !Number.isFinite(s.lastPrice) || s.lastPrice<=0 ||
       s.changes.day===null || !Number.isFinite(s.changes.day) ||
       !Number.isFinite(s.volume) || s.volume<=0) return [];
    const value=tradedValueFor({
      code:s.code,name:s.name,lastPrice:s.lastPrice,changePct:s.changes.day,
      volume:s.volume,marketCap:s.marketCap,turnover:s.turnover
    });
    return [{
      code:s.code,name:s.name,lastPrice:s.lastPrice,changePct:s.changes.day,
      volume:s.volume,marketCap:s.marketCap,logoUrl:s.logoUrl,
      turnover:s.turnover,tradedValue:value.value,valueSource:value.source
    }];
  });
  if(top.length!==10) return null;
  return {
    kind:"MARKET_TRENDING" as const,
    key:"market:"+slot.date+":"+slot.key+":TRENDING",
    title:"Top 10 Trending · "+slot.key+" WIB",
    embed:{
      title:(input.preview?"PREVIEW ONLY · ":"")+"IDX · TOP 10 TRENDING · "+slot.key+" WIB",
      description:[
        "**Market Tape · peringkat volume saham (lembar)**",
        issuerDescription(top),
        "**Date**",formattedTradingDate(slot.date),
        "**Source**","[IDX Terminal]("+IDX_TERMINAL_MARKET_URL+")",
      ].join("\n\n").slice(0,4096),
      url:IDX_TERMINAL_MARKET_URL,
      color:0xf59e0b,timestamp:input.now.toISOString(),
      _marketRows:top,
    },
  };
}
