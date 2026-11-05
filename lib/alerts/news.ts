import "server-only";
import { prisma } from "@/lib/db/prisma";
import { sendDiscordEmbed } from "./discord";
import { eligibleNewsSource, marketNewsEmbed, newsSourceKey } from "./news-rules";
import { getAlertSettings } from "./store";
import { nextRetryDelayMs } from "./rules";

/** Dedicated channel is intentional: do not silently send news to stock-alert. */
export function newsWebhookConfigured(){
 return Boolean(process.env.DISCORD_MARKET_NEWS_WEBHOOK_URL?.trim());
}
export async function syncMarketNewsOutbox(now=new Date()){
 if(!newsWebhookConfigured()) return 0;
 const settings=await getAlertSettings();
 if(!settings.enabled) return 0;
 const latest=await prisma.intelligenceSource.findMany({
   where:{fetchedAt:{gte:new Date(now.getTime()-3*60*60_000)},
     status:{not:"UNAVAILABLE"}},
   orderBy:{fetchedAt:"desc"},take:100,
 });
 let added=0;
 for(const source of latest){
   if(!eligibleNewsSource(source,now)) continue;
   const marketKey=newsSourceKey(source.sourceDocumentId);
   const existing=await prisma.discordAlertDelivery.findUnique({where:{marketKey},select:{id:true}});
   if(existing) continue;
   const embed=marketNewsEmbed(source);
   await prisma.discordAlertDelivery.upsert({
     where:{marketKey},update:{},
     create:{marketKey,kind:"MARKET_NEWS",destination:"discord:news",
       displayTitle:source.title,payloadJson:JSON.stringify(embed),status:"PENDING"},
   });
   added++;
 }
 return added;
}
export async function dispatchMarketNews(limit=10){
 const settings=await getAlertSettings();
 if(!settings.enabled||!newsWebhookConfigured()) return {sent:0,failed:0};
 const now=new Date();
 const jobs=await prisma.discordAlertDelivery.findMany({
   where:{kind:"MARKET_NEWS",destination:"discord:news",
     OR:[
       {status:"PENDING"},
       {status:"RETRY",nextAttemptAt:{lte:now}},
       {status:"SENDING",updatedAt:{lt:new Date(now.getTime()-10*60_000)}},
     ]},
   orderBy:{createdAt:"asc"},take:Math.min(20,Math.max(1,limit)),
 });
 let sent=0,failed=0;
 for(const job of jobs){
   if(job.createdAt.getTime()<now.getTime()-12*60*60_000){
     await prisma.discordAlertDelivery.updateMany({
       where:{id:job.id,status:job.status,updatedAt:job.updatedAt},
       data:{status:"SKIPPED",lastError:"News is no longer recent"}
     });
     continue;
   }
   const claimed=await prisma.discordAlertDelivery.updateMany({
     where:{id:job.id,status:job.status,updatedAt:job.updatedAt},
     data:{status:"SENDING",attempts:{increment:1}}
   });
   if(claimed.count!==1) continue;
   let result:Awaited<ReturnType<typeof sendDiscordEmbed>>;
   try{
     const embed=JSON.parse(job.payloadJson??"null");
     result=embed?await sendDiscordEmbed(embed,"news"):
       {ok:false,error:"Missing source document alert",permanent:true,retryAfterMs:0};
   }catch{
     result={ok:false,error:"Unreadable market-news payload",permanent:true,retryAfterMs:0};
   }
   if(result.ok){
     sent++;
     await prisma.discordAlertDelivery.update({where:{id:job.id},
       data:{status:"SENT",sentAt:new Date(),lastError:null}});
   }else{
     failed++;
     const permanent=result.permanent||job.attempts+1>=6;
     await prisma.discordAlertDelivery.update({where:{id:job.id},
       data:{status:permanent?"FAILED":"RETRY",
         lastError:result.error.slice(0,250),
         nextAttemptAt:new Date(Date.now()+nextRetryDelayMs(job.attempts+1,result.retryAfterMs))}});
   }
 }
 return {sent,failed};
}
export async function processMarketNews(){
 if(!newsWebhookConfigured()) return;
 try{
   await syncMarketNewsOutbox();
   await dispatchMarketNews();
 }catch(error){
   console.error("[news-alert] processing failed",error instanceof Error?error.message:"unknown");
 }
}
export async function newsAlertDiagnostics(){
 const now=new Date();
 const [recent,latest,delivery]=await Promise.all([
   prisma.intelligenceSource.count({where:{fetchedAt:{gte:new Date(now.getTime()-24*60*60_000)}}}),
   prisma.intelligenceSource.findFirst({orderBy:{fetchedAt:"desc"},
     select:{title:true,fetchedAt:true,aiStatus:true,status:true}}),
   prisma.discordAlertDelivery.findFirst({where:{kind:"MARKET_NEWS"},
     orderBy:{createdAt:"desc"},select:{status:true,sentAt:true,lastError:true,displayTitle:true}}),
 ]);
 return {
   webhookConfigured:newsWebhookConfigured(),
   recentlyDiscoveredSources:recent,
   latestSource:latest?{
      title:latest.title,fetchedAt:latest.fetchedAt.toISOString(),
      status:latest.status,aiStatus:latest.aiStatus,
   }:null,
   latestDelivery:delivery?{
      status:delivery.status,sentAt:delivery.sentAt?.toISOString()??null,
      lastError:delivery.lastError,title:delivery.displayTitle,
   }:null,
 };
}
export async function sendMarketNewsTest(){
 if(!newsWebhookConfigured())
   throw Error("Configure DISCORD_MARKET_NEWS_WEBHOOK_URL in Vercel Production.");
 const recent=await prisma.discordAlertDelivery.findFirst({
   where:{kind:"NEWS_TEST",createdAt:{gte:new Date(Date.now()-60_000)}},select:{id:true}
 });
 if(recent) throw Error("Wait at least 60 seconds between news tests.");
 const entry=await prisma.discordAlertDelivery.create({data:{
   kind:"NEWS_TEST",destination:"discord:news",status:"SENDING",attempts:1,
   displayTitle:"Market News connection test"
 }});
 const result=await sendDiscordEmbed({
   title:"IDX Terminal · Market News connection successful",
   description:"Admin test only. This is not an actual market article. Future messages contain newly discovered source documents and their original links.",
   color:0xe7b875,timestamp:new Date().toISOString(),
 },"news");
 await prisma.discordAlertDelivery.update({where:{id:entry.id},
   data:{status:result.ok?"SENT":"FAILED",sentAt:result.ok?new Date():null,
     lastError:result.ok?null:result.error}});
 return result.ok?{ok:true}:{ok:false,error:result.error};
}
export async function retryMarketNews(){
 await prisma.discordAlertDelivery.updateMany({
   where:{kind:"MARKET_NEWS",status:{in:["RETRY","FAILED"]}},
   data:{status:"RETRY",attempts:0,nextAttemptAt:new Date()}
 });
 return dispatchMarketNews();
}
