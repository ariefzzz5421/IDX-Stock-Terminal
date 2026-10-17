import "server-only";
import { ImageResponse } from "next/og";
import { resolveLogo } from "@/lib/logos";
import { marketCapText, rupiah } from "./market-rules";

export type IssuerCardRow = {
  code:string;
  lastPrice:number;
  changePct:number;
  volume:number;
  marketCap:number|null;
  tradedValue:number|null;
  valueSource:"reported"|"estimated"|"unavailable";
};

const compact=(value:number)=>new Intl.NumberFormat("id-ID",{
  notation:"compact",maximumFractionDigits:1,
}).format(value);
const money=(value:number|null)=>value===null?"N/D":marketCapText(value);
const logoHostnames=new Set([
  "s3-symbol-logo.tradingview.com",
  "storage.invezgo.com",
  "bumiresources.com",
  "www.adaroindonesia.com",
]);

/** SVG from allowlisted logo hosts only. Block active/external content. */
export function safeLogoSvg(svg: string): boolean {
  const trimmed = svg.replace(/^\uFEFF/, "").trim();
  if (!/<svg(?:\s|>)/i.test(trimmed) || trimmed.length > 120_000) return false;
  // Restrict external references and active content before sending to Satori.
  if (/<\s*(?:script|foreignObject|iframe|object|embed|image|use|a)\b/i.test(trimmed)) return false;
  if (/\bon\w+\s*=|@import|<\?xml-stylesheet|<!DOCTYPE|<!ENTITY/i.test(trimmed)) return false;
  if (/\b(?:href|xlink:href)\s*=|url\s*\(\s*['"]?\s*(?:https?:|data:|\/\/)/i.test(trimmed)) return false;
  return true;
}

/** Download only trusted image domains; bad/unsupported images become monograms. */
async function logoData(code:string):Promise<string|null> {
  const image=resolveLogo(code);
  if(!image) return null;
  try {
    if (image.url.startsWith("/") || !logoHostnames.has(new URL(image.url).hostname)) return null;
    const result=await fetch(image.url,{signal:AbortSignal.timeout(2500),cache:"force-cache"});
    if(!result.ok) return null;
    const type=(result.headers.get("content-type")??"").split(";")[0].trim();
    if(!["image/png","image/jpeg","image/webp","image/svg+xml"].includes(type)) return null;
    const bytes=await result.arrayBuffer();
    if(bytes.byteLength<1||bytes.byteLength>120_000) return null;
    if (type==="image/svg+xml") {
      const svg=new TextDecoder().decode(bytes);
      if(!safeLogoSvg(svg)) return null;
    }
    return "data:"+type+";base64,"+Buffer.from(bytes).toString("base64");
  } catch { return null; }
}

export async function renderMarketCard(title:string,rows:IssuerCardRow[]):Promise<Uint8Array> {
  const top=rows.filter(r=>/^[A-Z0-9]{4,6}$/.test(r.code)).slice(0,10);
  if(!top.length) throw Error("No valid issuer rows");
  const logos=await Promise.all(top.map(r=>logoData(r.code)));
  const image=new ImageResponse(
    <div style={{
      display:"flex",flexDirection:"column",width:"100%",height:"100%",
      background:"#0e121b",color:"#f5f7fc",padding:"32px 38px",
      fontFamily:"sans-serif",
    }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div style={{display:"flex",flexDirection:"column"}}>
          <span style={{fontSize:15,color:"#e9aa45",letterSpacing:3}}>IDX STOCK TERMINAL</span>
          <span style={{fontSize:30,fontWeight:800,marginTop:6}}>{title.slice(0,70)}</span>
        </div>
        <span style={{fontSize:14,color:"#89a3bc"}}>MARKET SNAPSHOT</span>
      </div>
      <div style={{display:"flex",flexDirection:"row",padding:"10px 18px",background:"#242a36",color:"#aab9ce",fontSize:14}}>
        <span style={{width:54}}>#</span><span style={{width:240}}>EMITEN</span>
        <span style={{width:160}}>HARGA / %</span><span style={{width:156}}>VOLUME</span>
        <span style={{width:164}}>VALUE (IDR)</span><span style={{width:142}}>MCAP</span>
      </div>
      {top.map((r,i)=><div key={r.code} style={{
        display:"flex",alignItems:"center",height:76,padding:"8px 18px",
        borderBottom:"1px solid #283346",background:i%2===0?"#131b28":"#192231",
      }}>
        <span style={{width:54,fontSize:18,color:"#a0b2c8"}}>{i+1}</span>
        <div style={{width:240,display:"flex",alignItems:"center"}}>
          <div style={{
            display:"flex",width:44,height:44,background:"#28405a",borderRadius:12,
            alignItems:"center",justifyContent:"center",marginRight:12,overflow:"hidden",
          }}>
            {logos[i]
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logos[i]!} width={44} height={44} style={{objectFit:"contain"}} alt=""/>
              : <span style={{fontSize:14,fontWeight:800,color:"#f5f7fc"}}>{r.code.slice(0,2)}</span>}
          </div>
          <span style={{fontSize:21,fontWeight:700}}>{r.code}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",width:160}}>
          <span style={{fontSize:17,fontWeight:700}}>{rupiah(r.lastPrice)}</span>
          <span style={{fontSize:14,color:r.changePct>=0?"#64d9a6":"#ff8c92"}}>
            {(r.changePct>=0?"+":"")+r.changePct.toFixed(2)}%
          </span>
        </div>
        <span style={{width:156,fontSize:17}}>{compact(r.volume)}</span>
        <div style={{width:164,display:"flex",flexDirection:"column"}}>
          <span style={{fontSize:17}}>{money(r.tradedValue)}</span>
          <span style={{fontSize:12,color:"#91a2b8"}}>{r.valueSource==="reported"?"Reported":r.valueSource==="estimated"?"Estimate":"Unavailable"}</span>
        </div>
        <span style={{width:142,fontSize:17}}>{money(r.marketCap)}</span>
      </div>)}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:20,color:"#8299b5",fontSize:13}}>
        <span>TradingView IDX scanner · delayed/indicative · not verified live ticks</span>
        <span>Source-based snapshot</span>
      </div>
    </div>,{width:1060,height:995}
  );
  const bytes=await image.arrayBuffer();
  return new Uint8Array(bytes);
}
