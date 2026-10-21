import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getLatestIdxStockSummary } from "@/lib/market-data/idx-official";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { getAlertSettings,discordWebhookConfigured } from "./store";
import { jakartaDate, type Cap } from "./market-rules";
import { buildClosingDigest,closingSlot } from "./closing-rules";
import { dispatchMarketDeliveries } from "./market";

/** The EOD message is only created from BEI's published, full,
 * same-date stock summary. No stale TradingView intraday fallback.
 */
export async function runClosingDigest() {
  const now=new Date();
  const holidays=(process.env.MARKET_HOLIDAY_DATES??"").split(",").map(s=>s.trim());
  if(!closingSlot(now,holidays)) return {queued:0,sent:0,failed:0,message:"Not the 16:30 WIB closing slot or exchange holiday"};
  const settings=await getAlertSettings();
  if(!settings.enabled || !settings.marketVolumeEnabled || !discordWebhookConfigured())
    return {queued:0,sent:0,failed:0,message:"Closing digest disabled or webhook missing"};
  const official=await getLatestIdxStockSummary();
  if(!official.available || official.date!==jakartaDate(now) || official.rows.length<50)
    return {queued:0,sent:0,failed:0,message:"Today's complete official BEI closing summary not yet available; no stale alert sent"};
  const lookup:Record<string,Cap>={};
  for(const row of official.rows){
    const cap=getCompanyCatalogEntry(row.code)?.marketCap;
    if(cap && cap>0) lookup[row.code]={value:cap,source:"Catalog estimate (possibly stale)"};
  }
  const signal=buildClosingDigest({
    now,date:official.date,rows:official.rows,lookup,holidays,
  });
  if(!signal) return {queued:0,sent:0,failed:0,message:"Official closing rows incomplete or invalid"};
  await prisma.discordAlertDelivery.upsert({
    where:{marketKey:signal.key},update:{},
    create:{marketKey:signal.key,kind:signal.kind,destination:"discord:market",
      displayTitle:signal.title,payloadJson:JSON.stringify(signal.embed),status:"PENDING"},
  });
  const result=await dispatchMarketDeliveries();
  return {queued:1,...result,message:"Closing digest processed"};
}
export async function runClosingDigestSafely() {
  try{return await runClosingDigest();}
  catch(e){
    console.error("[closing-alert] scan failed",e instanceof Error?e.message:"unknown");
    return {queued:0,sent:0,failed:0,message:"Official closing digest unavailable"};
  }
}
