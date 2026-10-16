"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, BellRing, CheckCircle2, ExternalLink, Eye, Send, Settings2, ShieldAlert } from "lucide-react";

type AlertPreferences = {
  marketDigestEnabled: boolean; priceLimitsEnabled: boolean;
  marketTopCount: number; enabled: boolean;
};
type Embed = {title?:string;description?:string;color?:number;url?:string;
  fields?: Array<{name:string;value:string;inline?:boolean}>;footer?:{text?:string}};
type MarketPreview = {date:string|null;source:string;message:string;
  previews:Array<{type:string;title:string;embed:Embed}>};
const button = "inline-flex min-h-10 items-center gap-2 border border-rule-hi px-3 py-2 text-xs font-bold uppercase tracking-wider text-ink-hi hover:border-amber disabled:opacity-40";
const card = "border border-rule bg-panel-hi px-4 py-3";

export function MarketAlertControls({initial,configured,marketChannel}:{
 initial:AlertPreferences;configured:boolean;marketChannel:boolean;
}) {
  const router=useRouter();
  const [digest,setDigest]=useState(initial.marketDigestEnabled);
  const [limits,setLimits]=useState(initial.priceLimitsEnabled);
  const [topCount,setTopCount]=useState(initial.marketTopCount===10?10:5);
  const [preview,setPreview]=useState<MarketPreview|null>(null);
  const [selected,setSelected]=useState(0);
  const [busy,setBusy]=useState<string|null>(null);
  const [notice,setNotice]=useState<string|null>(null);

  async function action(task:"save"|"preview"|"test"|"scan") {
    setBusy(task);setNotice(null);
    try {
      const route=task==="preview"?"/api/alerts/market/preview":"/api/alerts";
      const response=await fetch(route,task==="preview"?{method:"GET",cache:"no-store",credentials:"same-origin"}:{
        method:task==="save"?"PATCH":"POST",
        credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(task==="save"
          ? {scope:"market",marketDigestEnabled:digest,priceLimitsEnabled:limits,marketTopCount:topCount}
          : {action:task==="test"?"market-test":"market-scan"}),
      });
      const data=await response.json();
      if(!response.ok||data.ok===false)throw new Error(data.error??"Request failed");
      if(task==="preview"){setPreview(data as MarketPreview);setSelected(0);setNotice(data.message);}
      else {setNotice(task==="save"?"Market settings saved.":task==="test"?"Marked PREVIEW market embed sent to Discord.":String(data.message??"Market scan completed. Check delivery history."));router.refresh();}
    } catch(error) {setNotice(error instanceof Error?error.message:"Unable to load market alert data.");}
    finally {setBusy(null);}
  }
  const selectedEmbed=preview?.previews[selected]?.embed;
  return <section className="min-w-0 border-b border-rule bg-panel px-4 py-5 sm:px-6" aria-labelledby="market-alert-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-micro font-bold uppercase tracking-widest text-amber">MARKET / AUTO NOTIFICATIONS</p>
        <h2 id="market-alert-title" className="mt-2 flex items-center gap-2 font-display text-xl font-bold text-ink-hi"><Activity className="h-5 w-5 text-cyan"/>Market Movers & Price Limits</h2>
        <p className="mt-2 text-xs leading-6 text-dim">Top movers dan ARA/ARB indikatif dari Ringkasan Saham BEI. Semua embed mencantumkan market cap, tanggal snapshot, dan sumber. Bukan data tick real-time.</p>
      </div>
      <div className="border border-rule px-3 py-2 text-micro uppercase tracking-wider text-cyan">{marketChannel?"Separate market channel":"Main Discord webhook"}</div>
    </div>
    <div className="mt-5 grid gap-3 lg:grid-cols-3">
      <label className={card+" flex cursor-pointer items-start gap-3"}>
        <input type="checkbox" checked={digest} onChange={e=>setDigest(e.target.checked)} className="mt-0.5 h-4 w-4 accent-amber"/>
        <span><strong className="block text-sm text-ink-hi">Top Gainers & Losers</strong><span className="mt-1 block text-xs leading-5 text-dim">Daily digest setelah tutup pasar; satu embed untuk masing-masing daftar.</span></span>
      </label>
      <label className={card+" flex cursor-pointer items-start gap-3"}>
        <input type="checkbox" checked={limits} onChange={e=>setLimits(e.target.checked)} className="mt-0.5 h-4 w-4 accent-amber"/>
        <span><strong className="block text-sm text-ink-hi">ARA / ARB Indicative</strong><span className="mt-1 block text-xs leading-5 text-dim">Satu alert per ticker/hari/status. Scanner VPS opsional untuk pemeriksaan intraday.</span></span>
      </label>
      <label className={card+" flex flex-col gap-2 text-xs font-bold uppercase tracking-wider text-ink-hi"}>
        Number of stocks
        <select value={topCount} onChange={e=>setTopCount(e.target.value==="10"?10:5)} className="border border-rule-hi bg-panel px-3 py-2 text-sm text-ink-hi">
          <option value={5}>Top 5 · default</option>
          <option value={10}>Top 10</option>
        </select>
        <span className="normal-case font-normal text-dim">Daily digest · per direction</span>
      </label>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" className={button} onClick={()=>void action("save")} disabled={busy!==null}><Settings2 className="h-4 w-4"/>Save market rules</button>
      <button type="button" className={button} onClick={()=>void action("preview")} disabled={busy!==null}><Eye className="h-4 w-4"/>Load sourced preview</button>
      <button type="button" className={button} onClick={()=>void action("test")} disabled={busy!==null||!configured}><Send className="h-4 w-4"/>Send market preview test</button>
      <button type="button" className={button} onClick={()=>void action("scan")} disabled={busy!==null||!configured||!initial.enabled}><BellRing className="h-4 w-4"/>Run EOD check</button>
    </div>
    {notice&&<p role="status" className="mt-3 border border-rule bg-panel-hi p-3 text-xs text-cyan"><CheckCircle2 className="mr-2 inline h-4 w-4"/>{notice}</p>}
    <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-ink-hi">Sourced Discord embed preview</h3>
        <p className="mt-1 text-xs text-dim">Reads the latest BEI summary. Old trading dates are always labeled; preview does not generate market notifications.</p>
        {preview&&<div className="mt-3 flex flex-wrap gap-2">
          {preview.previews.map((item,i)=><button type="button" key={item.title+i}
            aria-pressed={selected===i} onClick={()=>setSelected(i)}
            className={"border px-2 py-1.5 text-micro "+(selected===i?"border-amber text-amber":"border-rule-hi text-ink")}>{item.title}</button>)}
        </div>}
        {selectedEmbed?<div className="mt-3 flex gap-2 rounded-md bg-[#232428] p-3">
          <div className="w-1 shrink-0 rounded-full" style={{backgroundColor:"#"+(selectedEmbed.color??0x5865f2).toString(16).padStart(6,"0")}}/>
          <div className="min-w-0 space-y-2 text-xs text-[#DBDEE1]">
            <p className="font-bold text-white">{selectedEmbed.title}</p>
            <p className="whitespace-pre-wrap break-words">{selectedEmbed.description}</p>
            {selectedEmbed.fields?.map((field,i)=><p key={i}><strong className="text-[#ABB0BA]">{field.name}: </strong><span className="break-words">{field.value}</span></p>)}
            <p className="text-[#8F949E]">{selectedEmbed.footer?.text}</p>
            {selectedEmbed.url&&<a href={selectedEmbed.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#7DB7FF]">View on IDX Terminal <ExternalLink className="h-3 w-3"/></a>}
          </div>
        </div>:<div className="mt-3 border border-dashed border-rule-hi p-5 text-xs text-dim">{preview?"No preview available from current source.":"Select 'Load sourced preview' to inspect an embed with actual sourced market data and market cap."}</div>}
      </div>
      <div className="border border-rule bg-panel-hi p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink-hi"><ShieldAlert className="h-4 w-4 text-amber"/>Source integrity & schedule</h3>
        <div className="mt-3 space-y-3 text-xs leading-6 text-ink">
          <p><strong>Top movers:</strong> once/day via existing evening research cron (~21.00 WIB). Only same-date complete BEI summaries trigger a send.</p>
          <p><strong>Price limits:</strong> EOD via same cron. During the day, run the protected <code>/api/alerts/market/scan</code> from a VPS (optional, every 5 minutes). Cannot run 5-minute Cron on Vercel Hobby.</p>
          <p><strong>Market cap:</strong> BEI listed shares × latest reported price, fallback TradingView or stored issuer catalog. Fall back values are estimates and may be stale.</p>
          <p><strong>Corporate action:</strong> unchanged scanner; confirmed high/critical events now show reference market cap for each ticker.</p>
          <p><strong>Breaking news:</strong> separate BEI/OJK news ingestion not connected. The site will not invent news or treat rumors as confirmed disclosures.</p>
          <p><strong>Market destination:</strong> {marketChannel?"DISCORD_MARKET_WEBHOOK_URL configured.":"Uses existing DISCORD_WEBHOOK_URL. Set optional DISCORD_MARKET_WEBHOOK_URL for a separate channel."}</p>
        </div>
      </div>
    </div>
  </section>;
}
