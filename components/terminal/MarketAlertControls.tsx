"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Eye, Send, Settings2, BellRing } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";

type Initial = {enabled:boolean;marketVolumeEnabled:boolean;marketAraEnabled:boolean;marketArbEnabled:boolean;marketTopCount:number};
type IssuerRow = {code:string;lastPrice:number;changePct:number;volume:number;
  tradedValue:number|null;valueSource:"reported"|"estimated"|"unavailable";
  marketCap:number|null;logoUrl?:string|null;capSource?:string};
type Embed = {title?:string;description?:string;color?:number;url?:string;
  fields?:{name:string;value:string}[];footer?:{text?:string};_marketRows?:IssuerRow[]};
const idr=(v:number|null)=>v===null||!Number.isFinite(v)?"N/D":
  "Rp"+new Intl.NumberFormat("id-ID",{notation:"compact",maximumFractionDigits:2}).format(v);
const qty=(v:number)=>new Intl.NumberFormat("id-ID",{notation:"compact",maximumFractionDigits:1}).format(v);
type Preview = {message:string;previews:{type:string;title:string;embed:Embed}[]};
const button="inline-flex items-center gap-2 border border-rule-hi px-3 py-2 text-xs font-bold uppercase tracking-wider text-ink-hi hover:border-amber disabled:opacity-40";
const item="flex gap-3 border border-rule bg-panel-hi p-3 text-sm text-ink-hi";

export function MarketAlertControls({initial,configured,marketChannel}:{initial:Initial;configured:boolean;marketChannel:boolean}) {
  const router=useRouter();
  const [volume,setVolume]=useState(initial.marketVolumeEnabled);
  const [ara,setAra]=useState(initial.marketAraEnabled);
  const [arb,setArb]=useState(initial.marketArbEnabled);
  const [preview,setPreview]=useState<Preview|null>(null);
  const [selected,setSelected]=useState(0);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState(false);

  async function call(action:"save"|"preview"|"test"|"scan") {
    setBusy(true);setMessage("");setError(false);
    try {
      const isPreview=action==="preview";
      const response=await fetch(isPreview?"/api/alerts/market/preview":"/api/alerts",{
        method:isPreview?"GET":action==="save"?"PATCH":"POST",
        credentials:"same-origin",cache:"no-store",
        ...(!isPreview?{headers:{"Content-Type":"application/json"},
          body:JSON.stringify(action==="save"
            ? {scope:"market",marketVolumeEnabled:volume,marketAraEnabled:ara,marketArbEnabled:arb,marketTopCount:10}
            : {action:action==="test"?"market-test":"market-scan"})}:{}),
      });
      const data=await response.json();
      if(!response.ok||data.ok===false)throw new Error(data.error??"Request failed");
      if(isPreview){setPreview(data);setSelected(0);setMessage(data.message);}
      else {setMessage(action==="save"?"Pengaturan tersimpan.":action==="test"?"Preview terkirim ke Discord.":String(data.message??"Scan selesai."));router.refresh();}
    } catch(e) {setError(true);setMessage(e instanceof Error?e.message:"Unable to load market alerts.");}
    finally {setBusy(false);}
  }
  const embed=preview?.previews[selected]?.embed;
  return <section className="border-b border-rule px-4 py-5 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-micro font-bold tracking-widest text-amber">MARKET ALERTS</p>
        <h2 className="mt-2 flex items-center gap-2 font-display text-xl font-bold text-ink-hi"><Activity className="h-5 w-5 text-cyan"/>Market Watch · Top 10</h2>
      </div>
      <span className="border border-rule-hi px-2 py-1 text-micro text-cyan">{marketChannel?"MARKET CHANNEL":"MAIN WEBHOOK"}</span>
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
      <div className="min-w-0">
        <div className="grid gap-2 sm:grid-cols-3">
          {[{name:"Top 10 Volume",sub:"Hourly · :00 WIB",value:volume,change:setVolume},
            {name:"Top 10 ARA",sub:"Hourly · :05 WIB · Indicative",value:ara,change:setAra},
            {name:"Top 10 ARB",sub:"Every 5 min · Indicative",value:arb,change:setArb}
          ].map(s=><label key={s.name} className={item+" cursor-pointer"}>
            <input className="mt-1 h-4 w-4 accent-amber" type="checkbox" checked={s.value}
              onChange={e=>s.change(e.target.checked)}/>
            <span><strong>{s.name}</strong><span className="mt-1 block text-xs text-dim">{s.sub}</span></span>
          </label>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className={button} type="button" disabled={busy} onClick={()=>void call("save")}><Settings2 className="h-4 w-4"/>Save rules</button>
          <button className={button} type="button" disabled={busy} onClick={()=>void call("preview")}><Eye className="h-4 w-4"/>Embed preview</button>
          <button className={button} type="button" disabled={busy||!configured} onClick={()=>void call("test")}><Send className="h-4 w-4"/>Send preview test</button>
          <button className={button} type="button" disabled={busy||!configured||!initial.enabled} onClick={()=>void call("scan")}><BellRing className="h-4 w-4"/>Check now</button>
        </div>
        {message&&<p role="status" className={"mt-3 text-xs "+(error?"text-down":"text-cyan")}>{message}</p>}
        <div className="mt-5">
          <h3 className="text-xs font-bold text-ink-hi">Discord Embed Preview</h3>
          {preview&&<div className="mt-2 flex flex-wrap gap-2">{preview.previews.map((p,i)=>
            <button key={p.title+i} type="button" aria-pressed={selected===i} onClick={()=>setSelected(i)}
              className={"border px-2 py-1 text-micro "+(selected===i?"border-amber text-amber":"border-rule text-dim")}>{p.title}</button>)}</div>}
          {embed?<div className="mt-3 flex gap-2 rounded-md bg-[#292b32] p-4 text-sm text-white">
            <div className="w-1 shrink-0 rounded-md" style={{backgroundColor:"#"+(embed.color??0x5865f2).toString(16).padStart(6,"0")}}/>
            <div className="min-w-0 space-y-3">
              <p className="font-bold">{embed.title}</p>
              
              {embed._marketRows?.length ? <div className="min-w-0 space-y-2">
                {embed._marketRows.map((r,i)=><div key={r.code}
                  className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#414651] py-2 text-xs">
                  <span className="w-4 shrink-0 text-[#9ca3af]">{i+1}</span>
                  <CompanyLogo code={r.code} logoUrl={r.logoUrl} size="sm" />
                  <strong className="w-12">{r.code}</strong>
                  <span>{idr(r.lastPrice)}</span>
                  <span className={r.changePct>=0?"text-[#64d9a6]":"text-[#ff8c92]"}>
                    {r.changePct>=0?"+":""}{r.changePct.toFixed(2)}%
                  </span>
                  <span className="text-[#bbc9d9]">Vol {qty(r.volume)}</span>
                  <span className="text-[#bbc9d9]">
                    {r.valueSource==="reported"?"Value":"Est. Value"} {idr(r.tradedValue)}
                  </span>
                  <span className="text-[#bbc9d9]">MCap {idr(r.marketCap)}</span>
                </div>)}
              </div>:<p className="whitespace-pre-wrap break-words text-xs">{embed.description}</p>}

              {embed.fields?.map((f,i)=><p key={i} className="text-xs text-[#b9bcca]">{f.name}: {f.value}</p>)}
              <p className="text-micro text-[#9ca3af]">{embed.footer?.text}</p>
            </div>
          </div>:<div className="mt-2 border border-dashed border-rule p-4 text-xs text-dim">Klik Embed preview untuk menampilkan snapshot yang tersedia.</div>}
        </div>
      </div>
      <aside className="h-fit border border-rule bg-panel-hi p-4 text-xs text-ink">
        <h3 className="font-bold text-ink-hi">Alert Schedule · WIB</h3>
        <div className="mt-3 space-y-2 text-dim">
          <p><strong className="text-ink-hi">Volume</strong> · 09:00 / 10:00 / 11:00 / 14:00 / 15:00</p>
          <p><strong className="text-ink-hi">ARA / ARB</strong> · 09:05 / 10:05 / 11:05 / 14:05 / 15:05</p>
          <p><strong className="text-ink-hi">Corporate Action</strong> · saat terdeteksi, termasuk di luar jam pasar</p>
          <p><strong className="text-ink-hi">Market closed / break</strong> · tidak mengirim</p>
        </div>
        <p className="mt-3 border-t border-rule pt-3 text-micro text-dim">VPS scheduler diperlukan untuk otomatisasi intraday. Data TradingView dapat tertunda; ARA/ARB indikatif, bukan konfirmasi BEI.</p>
      </aside>
    </div>
  </section>;
}
