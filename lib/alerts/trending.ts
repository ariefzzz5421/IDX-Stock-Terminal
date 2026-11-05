import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getMarketActivity } from "@/lib/market-data/trending";
import { getAlertSettings, marketWebhookConfigured } from "./store";
import { buildTrendingSignal, trendingSlot } from "./trending-rules";
import { dispatchMarketDeliveries } from "./market";
import { sendDiscordEmbed } from "./discord";

function holidays(){
 return (process.env.MARKET_HOLIDAY_DATES??"").split(",").map(x=>x.trim()).filter(Boolean);
}
export async function previewTrendingAlert(){
 const snapshot=await getMarketActivity();
 return buildTrendingSignal({
   now:new Date(),fetchedAt:snapshot.fetchedAt,
   stocks:snapshot.byMarketCap.all,preview:true,
 });
}
export async function runTrendingAlerts(){
 const now=new Date();
 const settings=await getAlertSettings();
 if(!settings.enabled || !settings.marketTrendingEnabled || !marketWebhookConfigured())
   return {queued:0,sent:0,failed:0,message:"Trending alerts disabled or webhook missing"};
 if(!trendingSlot(now,now.toISOString(),holidays()))
   return {queued:0,sent:0,failed:0,message:"Trending slot closed, lunch break, weekend or holiday"};
 const snapshot=await getMarketActivity();
 const signal=buildTrendingSignal({now,fetchedAt:snapshot.fetchedAt,
   stocks:snapshot.byMarketCap.all,holidays:holidays()});
 if(!signal) return {queued:0,sent:0,failed:0,message:"Market Tape data unavailable, incomplete or stale"};
 await prisma.discordAlertDelivery.upsert({
   where:{marketKey:signal.key},update:{},
   create:{
     kind:signal.kind,marketKey:signal.key,destination:"discord:market",
     displayTitle:signal.title,payloadJson:JSON.stringify(signal.embed),status:"PENDING",
   }
 });
 const sent=await dispatchMarketDeliveries();
 return {queued:1,...sent,message:"Trending snapshot processed"};
}
export async function runTrendingAlertsSafely(){
 try{return await runTrendingAlerts();}
 catch(error){
   console.error("[trending-alert] failure",error instanceof Error?error.message:"unknown");
   return {queued:0,sent:0,failed:0,message:"Trending alert source or delivery unavailable"};
 }
}
export async function sendTrendingPreviewTest(){
 if(!marketWebhookConfigured()) throw new Error("Configure DISCORD_MARKET_WEBHOOK_URL or DISCORD_WEBHOOK_URL in Vercel.");
 const recent=await prisma.discordAlertDelivery.findFirst({
   where:{kind:"TEST",createdAt:{gte:new Date(Date.now()-60_000)}},select:{id:true},
 });
 if(recent) throw new Error("Wait at least 60 seconds between test messages.");
 const signal=await previewTrendingAlert();
 if(!signal) throw new Error("Market Tape source unavailable; cannot fabricate a preview.");
 const record=await prisma.discordAlertDelivery.create({data:{
    kind:"TEST",destination:"discord:market",status:"SENDING",attempts:1,
    displayTitle:"Trending preview test"
 }});
 const sent=await sendDiscordEmbed(signal.embed,"market");
 await prisma.discordAlertDelivery.update({where:{id:record.id},
   data:{status:sent.ok?"SENT":"FAILED",sentAt:sent.ok?new Date():null,lastError:sent.ok?null:sent.error}
 });
 return sent.ok?{ok:true}:{ok:false,error:sent.error};
}
