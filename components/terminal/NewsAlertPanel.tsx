"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, AlertTriangle, Send, RotateCcw } from "lucide-react";

type State = {
 webhookConfigured:boolean;
 recentlyDiscoveredSources:number;
 latestSource:{title:string;fetchedAt:string;status:string;aiStatus:string|null}|null;
 latestDelivery:{status:string;sentAt:string|null;lastError:string|null;title:string|null}|null;
};
export function NewsAlertPanel({state}:{state:State}) {
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [failed,setFailed]=useState(false);
 async function request(action:"news-test"|"news-retry"){
   setBusy(true);setMessage("");setFailed(false);
   try{
     const response=await fetch("/api/alerts",{method:"POST",
       headers:{"Content-Type":"application/json"},credentials:"same-origin",
       body:JSON.stringify({action})});
     const result=await response.json();
     if(!response.ok || result.ok===false)throw Error(result.error??"Discord request failed");
     setMessage(action==="news-test"?"Test sent to the dedicated Market News channel.":
       "Pending/failed Market News deliveries checked.");
     router.refresh();
   }catch(e){setFailed(true);setMessage(e instanceof Error?e.message:"Request failed");}
   finally{setBusy(false);}
 }
 return <section className="border-b border-rule px-4 py-5 sm:px-6">
   <div className="flex flex-wrap items-center justify-between gap-3">
     <div>
       <div className="flex items-center gap-2 font-display text-lg font-bold text-ink-hi">
         <Bell className="h-5 w-5 text-amber"/> Market News / AI Sources
       </div>
       <p className="mt-1 text-xs text-dim">
         Dokumen resmi baru dari AI Analyst · channel Discord terpisah
       </p>
     </div>
     <span className={"border px-2 py-1 text-micro "+(state.webhookConfigured?
       "border-cyan text-cyan":"border-down text-down")}>
       {state.webhookConfigured?"NEWS WEBHOOK CONFIGURED":"NEWS WEBHOOK MISSING"}
     </span>
   </div>
   <div className="mt-4 grid gap-4 lg:grid-cols-2">
     <div className="space-y-3 border border-rule bg-panel-hi p-4 text-xs">
       <p className="font-bold text-ink-hi">Connect #market-news-alert</p>
       <p className="text-dim">Discord channel → Edit Channel → Integrations → Webhooks → New Webhook → Copy URL.</p>
       <p className="text-dim">Vercel → IDX Stock Terminal → Settings → Environment Variables → add <code className="text-cyan">DISCORD_MARKET_NEWS_WEBHOOK_URL</code> to Production, then redeploy.</p>
       <p className="text-dim">Dokumen sumber baru dikirim dengan status verifikasi yang eksplisit. Event penting terkonfirmasi tetap menggunakan Corporate Intelligence webhook. News tidak dikirim ulang dari arsip lama.</p>
       <div className="flex flex-wrap gap-2">
         <button type="button" disabled={busy||!state.webhookConfigured}
           onClick={()=>void request("news-test")}
           className="inline-flex items-center gap-2 border border-rule-hi px-3 py-2 font-bold hover:border-amber disabled:opacity-40">
           <Send className="h-4 w-4"/> Test Market News
         </button>
         <button type="button" disabled={busy||!state.webhookConfigured}
           onClick={()=>void request("news-retry")}
           className="inline-flex items-center gap-2 border border-rule-hi px-3 py-2 font-bold hover:border-amber disabled:opacity-40">
           <RotateCcw className="h-4 w-4"/> Retry
         </button>
       </div>
       {message&&<p role="status" className={"flex gap-2 "+(failed?"text-down":"text-cyan")}>
         {failed?<AlertTriangle className="h-4 w-4"/>:<CheckCircle2 className="h-4 w-4"/>}{message}
       </p>}
     </div>
     <div className="space-y-3 border border-rule bg-panel-hi p-4 text-xs text-dim">
       <p><span className="font-bold text-ink-hi">Sources detected (24h):</span> {state.recentlyDiscoveredSources}</p>
       <div><p className="font-bold text-ink-hi">Latest AI source</p>
         {state.latestSource?<><p className="mt-1 break-words">{state.latestSource.title}</p>
         <p className="mt-1">{new Date(state.latestSource.fetchedAt).toLocaleString("id-ID",{timeZone:"Asia/Jakarta"})} WIB · {state.latestSource.status} · {state.latestSource.aiStatus??"No confirmed AI analysis"}</p></>
         :<p className="mt-1">No sources recorded.</p>}
       </div>
       <div><p className="font-bold text-ink-hi">Last news delivery</p>
         {state.latestDelivery?<><p className="mt-1 break-words">{state.latestDelivery.title}</p>
         <p className="mt-1">{state.latestDelivery.status}{state.latestDelivery.sentAt?" · "+new Date(state.latestDelivery.sentAt).toLocaleString("id-ID",{timeZone:"Asia/Jakarta"})+" WIB":""}</p>
         {state.latestDelivery.lastError&&<p className="mt-1 text-down">{state.latestDelivery.lastError}</p>}</>
         :<p className="mt-1">No delivery recorded. Test connection after configuring webhook.</p>}
       </div>
       <p className="border-t border-rule pt-2">AI source scans run on the existing morning/evening research schedule (about 08:00/21:00 WIB); not an instant breaking-news feed.</p>
     </div>
   </div>
 </section>;
}