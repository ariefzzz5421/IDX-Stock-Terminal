import { jakartaNow } from "../market-session";
import { indicativeLimitStatus } from "../market-data/limit-status";
import { marketCapText, jakartaDate, capForRow, type Cap, type MarketRow, type MarketSignal, rupiah } from "./market-rules";
import { formattedTradingDate, issuerDescription, IDX_TERMINAL_MARKET_URL, type MarketIssuerRow } from "./intraday-rules";

/** Special after-close slot. Weekdays are only candidates; official same-day
 * BEI data and the maintained holiday list must ALSO pass before dispatch.
 */
export function closingSlot(now: Date, holidays: string[] = []) {
  const clock=jakartaNow(now);
  const date=jakartaDate(now);
  return clock.weekday>=1 && clock.weekday<=5 &&
    clock.hour===16 && clock.minute>=30 && clock.minute<33 &&
    !holidays.includes(date) ? {date,key:"16:30"} : null;
}

export function buildClosingDigest(args:{
  now:Date;date:string;rows:MarketRow[];lookup:Record<string,Cap>;
  holidays?:string[];preview?:boolean;
}):MarketSignal|null {
  const {now,date,rows,lookup}=args;
  const slot=args.preview?{date,key:"16:30"}:closingSlot(now,args.holidays);
  if(!slot || !date || (!args.preview && date!==slot.date)) return null;
  if(rows.length<50) return null; // Reject partial feeds, even in preview.
  const valid=rows.filter(r=>{
    const rowDate=r.date?.trim();
    const correct=!rowDate || rowDate.startsWith(date) ||
      rowDate.replaceAll("-","").startsWith(date.replaceAll("-",""));
    return correct && /^[A-Z0-9]{4,6}$/.test(r.code) &&
      r.close!=null && Number.isFinite(r.close) && r.close>0 &&
      r.previous!=null && Number.isFinite(r.previous) && r.previous>0 &&
      r.value!=null && Number.isFinite(r.value) && r.value>0 &&
      r.volume!=null && Number.isFinite(r.volume) && r.volume>0;
  });
  if(valid.length<50) return null;
  const ranked=valid.map(r=>({
    row:r,
    changePct:((r.close!-r.previous!)/r.previous!)*100,
    marketCap:capForRow(r,lookup).value,
  }));
  const byValue=[...ranked].sort((a,b)=>b.row.value!-a.row.value! || a.row.code.localeCompare(b.row.code));
  const top=byValue.slice(0,10).map(r=>({
    code:r.row.code,name:r.row.name,lastPrice:r.row.close!,
    changePct:r.changePct, volume:r.row.volume!,
    marketCap:r.marketCap,tradedValue:r.row.value!,valueSource:"reported" as const,
  })) satisfies MarketIssuerRow[];
  if(top.length<10) return null;
  const ara=byValue.filter(r=>indicativeLimitStatus(r.row.code,r.row.close,r.changePct)==="ARA_INDICATIVE").slice(0,10);
  const arb=byValue.filter(r=>indicativeLimitStatus(r.row.code,r.row.close,r.changePct)==="ARB_INDICATIVE").slice(0,10);
  const gainers=[...ranked].filter(r=>r.changePct>0).sort((a,b)=>b.changePct-a.changePct).slice(0,5);
  const losers=[...ranked].filter(r=>r.changePct<0).sort((a,b)=>a.changePct-b.changePct).slice(0,5);
  const fmt=(r:typeof ranked[number])=>r.row.code+" "+rupiah(r.row.close)+" ~ "+
    (r.changePct>=0?"+":"")+new Intl.NumberFormat("id-ID",{
      minimumFractionDigits:2,maximumFractionDigits:2,
    }).format(r.changePct)+"%";
  const brief=(xs:typeof ranked)=>xs.length?xs.map(fmt).join("\n"):"Tidak ada kandidat dari ringkasan ini";
  const description=[
    "**Top 10 Nilai Transaksi (IDR)**",issuerDescription(top),
    "**Top ARA (indikatif)**",brief(ara),
    "**Top ARB (indikatif)**",brief(arb),
    "**Top Gainers**",brief(gainers),
    "**Top Losers**",brief(losers),
    "**Date**",formattedTradingDate(date),
    "**Source**","[IDX Terminal]("+IDX_TERMINAL_MARKET_URL+") · [BEI Ringkasan Saham](https://www.idx.co.id/id/data-pasar/ringkasan-perdagangan/ringkasan-saham/)",
    "*ARA/ARB berupa perhitungan indikatif, bukan status resmi yang terkonfirmasi.*"
  ].join("\n\n");
  return {
    kind:"MARKET_CLOSE",
    key:"market:"+date+":16:30:CLOSE",
    title:(args.preview?"PREVIEW · ":"")+"IDX Closing Summary · "+date,
    embed:{
      title:(args.preview?"PREVIEW ONLY · ":"")+"IDX · CLOSING SUMMARY · 16:30 WIB",
      description:description.slice(0,4096),
      color:0xeec780,url:IDX_TERMINAL_MARKET_URL,
      timestamp:now.toISOString(),_marketRows:top,
    },
  };
}
