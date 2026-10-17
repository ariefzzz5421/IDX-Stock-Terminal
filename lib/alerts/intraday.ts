import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getMarketActivity } from "@/lib/market-data/trending";
import { getAlertSettings, discordWebhookConfigured } from "./store";
import { buildIntradaySignals, intradaySlot, type IntradayStock } from "./intraday-rules";
import { dispatchMarketDeliveries } from "./market";
import { sendDiscordEmbed } from "./discord";
import { fetchOptionalMsnMarketCaps } from "@/lib/market-data/msn-metadata";

function holidayDates() {
  return (process.env.MARKET_HOLIDAY_DATES ?? "").split(",")
    .map(x => x.trim()).filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x));
}
function transform(stocks: Awaited<ReturnType<typeof getMarketActivity>>["allStocks"]):IntradayStock[] {
  return stocks.map(s => ({
    code:s.code, name:s.name, lastPrice:s.lastPrice, volume:s.volume,
    marketCap:s.marketCap, changePct:s.changes.day,
    turnover:s.turnover,logoUrl:s.logoUrl,capSource:"TradingView/catalog",
  }));
}

/** Metadata fallback is optional and never replaces alert-critical price/volume. */
async function enrichMarketCaps(stocks:IntradayStock[]):Promise<IntradayStock[]> {
  const needsCap=stocks.filter(s=>!s.marketCap || s.marketCap<=0)
    .sort((a,b)=>b.volume-a.volume).slice(0,20);
  if (!needsCap.length) return stocks;
  const metadata=await fetchOptionalMsnMarketCaps(needsCap.map(s=>s.code));
  if(!metadata.size) return stocks;
  return stocks.map(s=>{
    const cap=metadata.get(s.code);
    return cap && (!s.marketCap || s.marketCap<=0)
      ? {...s,marketCap:cap.marketCap,capSource:cap.source}:s;
  });
}

export async function runIntradayAlerts() {
  const settings = await getAlertSettings();
  const now = new Date();
  if (!settings.enabled || !discordWebhookConfigured()) return { queued:0,sent:0,failed:0,message:"Alerts disabled" };
  if (!settings.marketVolumeEnabled && !settings.marketAraEnabled && !settings.marketArbEnabled)
    return { queued:0,sent:0,failed:0,message:"Market rules disabled" };
  // Session/holiday filter happens before any network call or dispatch.
  if (!intradaySlot(now,now.toISOString(),holidayDates()))
    return {queued:0,sent:0,failed:0,message:"Market closed, break, holiday or outside scheduled slot"};
  const snapshot = await getMarketActivity();
  const stocks = await enrichMarketCaps(transform(snapshot.allStocks));
  const signals = buildIntradaySignals({
    now, fetchedAt:snapshot.fetchedAt,stocks,
    volumeEnabled:settings.marketVolumeEnabled,
    araEnabled:settings.marketAraEnabled,arbEnabled:settings.marketArbEnabled,
    marketTopCount:settings.marketTopCount,holidays:holidayDates(),
  });
  // Insert-once unique keys: calendar date + five-minute slot + alert type.
  for (const signal of signals) {
    await prisma.discordAlertDelivery.upsert({
      where:{marketKey:signal.key},update:{},
      create:{kind:signal.kind,destination:"discord:market",marketKey:signal.key,
        displayTitle:signal.title,payloadJson:JSON.stringify(signal.embed),status:"PENDING"},
    });
  }
  const result = await dispatchMarketDeliveries();
  return {queued:signals.length,...result,message:signals.length
    ? "Intraday checks completed" : "No qualifying source data or price-limit candidates"};
}
export async function runIntradayAlertsSafely() {
  try {return await runIntradayAlerts();}
  catch(error) {
    console.error("[alerts] intraday unavailable",error instanceof Error ? error.message:"unknown");
    return {queued:0,sent:0,failed:0,message:"Source or alert engine unavailable"};
  }
}
export async function previewIntradayAlerts() {
  const snapshot = await getMarketActivity();
  const now = new Date();
  const stocks = await enrichMarketCaps(transform(snapshot.allStocks));
  const signals = buildIntradaySignals({
    now,fetchedAt:snapshot.fetchedAt,stocks,preview:true,
    volumeEnabled:true,araEnabled:true,arbEnabled:true,marketTopCount:10,
  });
  return {
    date:now.toISOString().slice(0,10),source:"TradingView IDX scanner (delayed)",
    message:"PREVIEW ONLY · Provider trade timestamps unavailable; prices may reflect an earlier session.",
    previews:signals.map(s=>({type:s.kind,title:s.title,embed:s.embed})),
  };
}
export async function sendIntradayPreviewTest() {
  const recent = await prisma.discordAlertDelivery.findFirst({
    where:{kind:"TEST",createdAt:{gte:new Date(Date.now()-60_000)}},select:{id:true},
  });
  if(recent) throw new Error("Wait at least 60 seconds between test messages.");
  const preview = await previewIntradayAlerts();
  const embed = preview.previews[0]?.embed;
  if(!embed) throw new Error("Market snapshot unavailable; no test data invented.");
  const log=await prisma.discordAlertDelivery.create({data:{
    kind:"TEST",destination:"discord:market",status:"SENDING",attempts:1,
    displayTitle:"Intraday preview test",
  }});
  const result=await sendDiscordEmbed(embed,"market");
  await prisma.discordAlertDelivery.update({where:{id:log.id},data:{
    status:result.ok?"SENT":"FAILED",sentAt:result.ok?new Date():null,
    lastError:result.ok?null:result.error,
  }});
  return result.ok ? {ok:true} : {ok:false,error:result.error};
}
