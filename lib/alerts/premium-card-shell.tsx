import "server-only";
import type { ReactNode } from "react";
import { resolveLogo } from "@/lib/logos";
import { safeLogoSvg } from "./svg-safety";

const trustedHosts = new Set([
  "s3-symbol-logo.tradingview.com", "storage.invezgo.com",
  "bumiresources.com", "www.adaroindonesia.com",
]);
export async function issuerLogoData(ticker: string): Promise<string|null> {
  const logo=resolveLogo(ticker);
  if(!logo) return null;
  try {
    const url=new URL(logo.url);
    if(url.protocol !== "https:" || !trustedHosts.has(url.hostname)) return null;
    const response=await fetch(url.toString(),{signal:AbortSignal.timeout(2000),cache:"force-cache"});
    if(!response.ok) return null;
    const mime=(response.headers.get("content-type")??"").split(";")[0].trim();
    if(!["image/png","image/jpeg","image/webp","image/svg+xml"].includes(mime)) return null;
    const buf=await response.arrayBuffer();
    if(buf.byteLength===0 || buf.byteLength>120_000) return null;
    if(mime==="image/svg+xml" && !safeLogoSvg(new TextDecoder().decode(buf))) return null;
    return "data:"+mime+";base64,"+Buffer.from(buf).toString("base64");
  }catch{return null;}
}

// Gold-lit architecture illustration contains no stock data and is safe
// to reuse with actual records rather than embedding a static mockup.
const buildingSvg='<svg xmlns="http://www.w3.org/2000/svg" width="530" height="250" viewBox="0 0 530 250"><defs><linearGradient id="g" x1="0" x2="1" y1="1" y2="0"><stop stop-color="#071827"/><stop offset=".65" stop-color="#1c303a"/><stop offset="1" stop-color="#6a593c"/></linearGradient><linearGradient id="w" x1="0" x2="1"><stop stop-color="#182b36"/><stop offset="1" stop-color="#5a4b35"/></linearGradient></defs><rect width="530" height="250" fill="url(#g)"/><g opacity=".8"><path d="M145 45 L326 0 L490 0 L490 250 L145 250Z" fill="url(#w)" stroke="#c09d63" stroke-width="1"/><path d="M145 45 L198 28 L198 250 L145 250Z" fill="#152b36"/><g stroke="#b68f58" stroke-opacity=".24" stroke-width="3"><path d="M173 35 V250 M221 25 V250 M261 15 V250 M301 5 V250 M341 0 V250 M381 0 V250 M421 0 V250 M461 0 V250"/><path d="M152 63 H490 M152 102 H490 M152 142 H490 M152 182 H490 M152 221 H490"/></g></g><g fill="#c6a36a" font-family="Arial,sans-serif" font-weight="bold" text-anchor="middle"><circle cx="385" cy="67" r="39" fill="none" stroke="#c5a56b" stroke-width="3"/><path d="M353 72 Q380 25 411 62 Q397 46 361 100" fill="none" stroke="#d9b779" stroke-width="4"/><text x="389" y="137" font-size="34" letter-spacing="2">IDX</text></g><path d="M0 229 L61 206 L100 213 L147 162 L193 185 L232 142 L289 160 L339 103 L386 132 L430 83 L472 94 L530 21" fill="none" stroke="#aa7b35" stroke-opacity=".3" stroke-width="9"/><path d="M0 229 L61 206 L100 213 L147 162 L193 185 L232 142 L289 160 L339 103 L386 132 L430 83 L472 94 L530 21" fill="none" stroke="#ffd388" stroke-width="2.5"/></svg>';
const BUILDING="data:image/svg+xml;base64,"+Buffer.from(buildingSvg).toString("base64");

export function IssuerMark({ticker,data,size=48}:{ticker:string;data:string|null;size?:number}) {
 return <div style={{display:"flex",height:size,width:size,minWidth:size,background:"#e8eff4",
   border:"1px solid #90a6b0",borderRadius:Math.round(size*.22),alignItems:"center",
   justifyContent:"center",overflow:"hidden",marginRight:13}}>
  {data ?
    // eslint-disable-next-line @next/next/no-img-element
    <img src={data} width={size} height={size} alt="" style={{objectFit:"contain"}}/>:
    <span style={{fontSize:size*.26,color:"#1f4963",fontWeight:800}}>{ticker.slice(0,3)}</span>}
 </div>;
}
export function PremiumFrame({title,clock,accent,subtitle,preview,footer,children}:{
 title:string;clock?:string;accent?:string;subtitle?:string;preview?:boolean;footer:string;children:ReactNode;
}) {
 return <div style={{display:"flex",width:"100%",height:"100%",padding:19,
    color:"#f7f7f7",fontFamily:"Arial,sans-serif",
    background:"linear-gradient(130deg,#051827 0%,#00111c 52%,#1b1b21 85%,#302418 100%)"}}>
   <div style={{display:"flex",width:"100%",height:"100%",flexDirection:"column",
     border:"2px solid #ad864b",borderRadius:28,position:"relative",padding:"26px 32px 22px",
     background:"linear-gradient(135deg,#031522 0%,#000d17 53%,#061723 100%)",overflow:"hidden"}}>
    <div style={{display:"flex",height:206,position:"relative",flexDirection:"column"}}>
      {/* decorative skyline never replaces stock data */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BUILDING} width={500} height={235} alt=""
        style={{position:"absolute",right:-30,top:-26,opacity:.76,objectFit:"cover"}}/>
      <div style={{display:"flex",alignItems:"center",height:46}}>
        <div style={{display:"flex",alignItems:"flex-end",height:28,marginRight:14}}>
          {[12,19,27,36].map((h,i)=><div key={i}
            style={{width:8,height:h,marginRight:5,background:"#e5bb73"}}/>)}
        </div>
        <span style={{fontSize:24,fontWeight:750,letterSpacing:5,color:"#edc27d"}}>IDX</span>
        <span style={{fontSize:23,fontWeight:400,letterSpacing:5,color:"#dbe3e7",marginLeft:12}}>STOCK TERMINAL</span>
      </div>
      <div style={{display:"flex",flexDirection:"row",alignItems:"baseline",marginTop:34,maxWidth:1050}}>
        <span style={{fontSize:49,fontWeight:800,color:"#f7f7f6",marginRight:19}}>IDX ·</span>
        <span style={{fontSize:title.length>25?43:51,fontWeight:800,color:accent??"#f0c87e",marginRight:17}}>{title}</span>
        {clock&&<span style={{fontSize:41,fontWeight:650,color:"#d8e4f1"}}>· {clock}</span>}
      </div>
      {subtitle&&<span style={{fontSize:17,letterSpacing:4,color:"#d6b777",marginTop:13}}>{subtitle}</span>}
      {preview&&<span style={{fontSize:19,color:"#ffb1ab",fontWeight:700,marginTop:7}}>PREVIEW ONLY · bukan data live terverifikasi</span>}
    </div>
    <div style={{display:"flex",flexDirection:"column",flexGrow:1,minHeight:0}}>
      {children}
    </div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:34,marginTop:10}}>
      <span style={{fontSize:15,letterSpacing:3,color:"#d4b47d"}}>{footer}</span>
      <div style={{display:"flex",alignItems:"center"}}>
        <div style={{width:44,height:2,background:"#f6cb85",marginRight:17}}/>
        <span style={{fontSize:16,letterSpacing:4,color:"#ebc47f"}}>IDX STOCK TERMINAL</span>
      </div>
    </div>
   </div>
 </div>;
}