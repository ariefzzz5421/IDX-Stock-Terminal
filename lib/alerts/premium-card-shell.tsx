import "server-only";
import type { ReactNode } from "react";
import { IdxMark } from "@/components/branding/IdxMark";
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

// Original vector depiction of the Indonesia Stock Exchange facade, inspired
// by the user's selected gold/navy mockup. No third-party stock photograph.
// Keep all issuer numbers out of this decorative header artwork.
const buildingSvg = String.raw`<svg xmlns="http://www.w3.org/2000/svg" width="680" height="270" viewBox="0 0 680 270">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
    <stop stop-color="#011523"/><stop offset=".53" stop-color="#062338"/><stop offset="1" stop-color="#3e352a"/>
  </linearGradient>
  <linearGradient id="facade" x1="0" y1="1" x2=".9" y2="0">
    <stop stop-color="#142d39"/><stop offset=".36" stop-color="#243843"/>
    <stop offset=".72" stop-color="#726349"/><stop offset="1" stop-color="#ba935e"/>
  </linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
    <stop stop-color="#071723"/><stop offset=".48" stop-color="#1a3643"/><stop offset="1" stop-color="#3e5357"/>
  </linearGradient>
  <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
    <stop stop-color="#00111d" stop-opacity="1"/>
    <stop offset=".24" stop-color="#00111d" stop-opacity=".5"/>
    <stop offset=".68" stop-color="#00111d" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="halo"><stop stop-color="#ecc584" stop-opacity=".29"/><stop offset="1" stop-color="#ecc584" stop-opacity="0"/></radialGradient>
</defs>
<rect width="680" height="270" fill="url(#sky)"/>
<circle cx="534" cy="44" r="188" fill="url(#halo)"/>
<!-- Tower blocks and narrow vertical glass mullions evoke the SCBD BEI frontage. -->
<path d="M226 72 L388 0 L510 0 L510 270 L226 270 Z" fill="#071a26" stroke="#a58d6a" stroke-width="1.4"/>
<path d="M287 48 L405 6 L405 270 L287 270 Z" fill="url(#glass)" stroke="#a98b59" stroke-opacity=".43"/>
<path d="M415 0 L553 0 L650 47 L650 270 L415 270 Z" fill="url(#facade)" stroke="#ad8a53" stroke-opacity=".65"/>
<path d="M226 72 L288 48 L288 270 L226 270 Z" fill="#071825"/>
<path d="M478 10 L586 30 L586 270 L478 270Z" fill="url(#glass)" fill-opacity=".52"/>
<g stroke="#c59c65" stroke-opacity=".23" stroke-width="2.5">
  <path d="M253 62 V270 M286 48 V270 M324 36 V270 M362 20 V270 M399 8 V270 M434 0 V270 M474 8 V270 M510 14 V270 M551 23 V270 M586 30 V270 M620 39 V270"/>
  <path d="M225 97 H648 M225 139 H648 M225 181 H648 M225 224 H648"/>
</g>
<g stroke="#5a7e90" stroke-opacity=".32" stroke-width="1">
  <path d="M250 0 V270 M268 0 V270 M304 0 V270 M340 0 V270 M376 0 V270 M450 0 V270 M488 0 V270 M526 0 V270 M563 0 V270 M598 0 V270"/>
  <path d="M230 74 H660 M230 113 H660 M230 153 H660 M230 194 H660 M230 238 H660"/>
</g>
<!-- IDX exchange globe and signage on the lit front facade. -->
<g transform="translate(492 75)">
  <circle r="42" fill="#2b2d2b" stroke="#bca179" stroke-width="3"/>
  <circle r="35" fill="#664835" fill-opacity=".24" stroke="#dbbb86" stroke-opacity=".52"/>
  <path d="M-25 17 C-6 -33 14 -33 31 -4 M-25 -8 C-2 17 13 21 30 -10 M-5 -33 C1 -2 3 17 5 34 M-34 1 C-8 -12 12 -10 34 1" stroke="#e7c187" stroke-width="3" fill="none"/>
  <text x="0" y="79" font-family="Arial,sans-serif" font-size="39" font-weight="700" fill="#e9c286" text-anchor="middle" letter-spacing="1">IDX</text>
  <text x="0" y="97" font-family="Arial,sans-serif" font-size="8" fill="#c7b48c" text-anchor="middle" letter-spacing="1">INDONESIA STOCK EXCHANGE</text>
</g>
<!-- Gold moving-market line echoing the original chosen design. -->
<path d="M42 234 L116 215 L159 225 L220 164 L273 184 L321 127 L370 146 L414 103 L466 116 L519 54 L559 84 L613 43 L680 0" stroke="#f9bf62" stroke-width="9" stroke-opacity=".17" fill="none"/>
<path d="M42 234 L116 215 L159 225 L220 164 L273 184 L321 127 L370 146 L414 103 L466 116 L519 54 L559 84 L613 43 L680 0" stroke="#f6c378" stroke-width="2.6" fill="none"/>
<rect width="680" height="270" fill="url(#fade)"/>
</svg>`;
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
export function PremiumFrame({title,clock,accent,subtitle,preview,footer,children,spacious=false,headingFont}:{
 title:string;clock?:string;accent?:string;subtitle?:string;preview?:boolean;footer:string;children:ReactNode;
 spacious?:boolean;headingFont?:string;
}) {
 return <div style={{display:"flex",width:"100%",height:"100%",padding:spacious?21:19,
    color:"#f7f7f7",fontFamily:"Arial,sans-serif",
    background:"linear-gradient(130deg,#051827 0%,#00111c 52%,#1b1b21 85%,#302418 100%)"}}>
   <div style={{display:"flex",width:"100%",height:"100%",flexDirection:"column",
     border:"2px solid #ad864b",borderRadius:28,position:"relative",padding:spacious?"26px 36px 28px":"26px 32px 22px",
     background:"linear-gradient(135deg,#031522 0%,#000d17 53%,#061723 100%)",overflow:"hidden"}}>
    <div style={{display:"flex",height:spacious?212:206,position:"relative",flexDirection:"column"}}>
      {/* decorative skyline never replaces stock data */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BUILDING} width={spacious?665:575} height={270} alt=""
        style={{position:"absolute",right:spacious?-42:-35,top:-26,opacity:.94,objectFit:"cover"}}/>
      <div style={{display:"flex",alignItems:"center",height:52,position:"relative"}}>
        <IdxMark width={75} height={35} decorative/>
        <div style={{display:"flex",alignItems:"baseline",marginLeft:15}}>
          <span style={{fontSize:34,color:"#ff1722",fontWeight:800}}>IDX</span>
          <span style={{fontSize:31,color:"#f5f5f8",fontWeight:750,marginLeft:10}}>Terminal</span>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"row",alignItems:"baseline",marginTop:spacious?32:34,maxWidth:1180,position:"relative"}}>
        <span style={{fontSize:49,fontWeight:800,color:"#f7f7f6",marginRight:19}}>IDX ·</span>
        <span style={{fontSize:title.length>25?43:spacious?55:51,fontWeight:800,fontFamily:headingFont??"Arial,sans-serif",color:accent??"#f0c87e",marginRight:17}}>{title}</span>
        {clock&&<span style={{fontSize:spacious?42:41,fontWeight:spacious?750:650,color:"#d8e4f1"}}>· {clock}</span>}
      </div>
      {subtitle&&<span style={{fontSize:17,letterSpacing:4,color:"#d6b777",marginTop:13}}>{subtitle}</span>}
      {preview&&<span style={{fontSize:19,color:"#ffb1ab",fontWeight:700,marginTop:7}}>PREVIEW ONLY · bukan data live terverifikasi</span>}
    </div>
    <div style={{display:"flex",flexDirection:"column",flexGrow:1,minHeight:0}}>
      {children}
    </div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:spacious?56:34,marginTop:spacious?14:10,paddingTop:spacious?10:0,borderTop:spacious?"1px solid #6a583d":"none"}}>
      <span style={{fontSize:spacious?17:15,letterSpacing:spacious?2:3,color:"#d4b47d"}}>{footer}</span>
      <div style={{display:"flex",alignItems:"center"}}>
        <div style={{width:44,height:2,background:"#f6cb85",marginRight:17}}/>
        <IdxMark width={54} height={26} decorative/>
        <div style={{display:"flex",alignItems:"baseline",marginLeft:10}}>
          <span style={{fontSize:23,color:"#ff1822",fontWeight:800}}>IDX</span>
          <span style={{fontSize:21,color:"#f6f8fa",fontWeight:750,marginLeft:7}}>Terminal</span>
        </div>
      </div>
    </div>
   </div>
 </div>;
}