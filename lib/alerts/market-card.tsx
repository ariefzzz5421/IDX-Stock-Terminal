import "server-only";
import { ImageResponse } from "next/og";
import { marketCapText, rupiah } from "./market-rules";
import { decimalPct, marketCardHeading } from "./card-content";
import { IssuerMark, PremiumFrame, issuerLogoData } from "./premium-card-shell";

export type IssuerCardRow = {
  code:string;lastPrice:number;changePct:number;volume:number;
  marketCap:number|null;tradedValue:number|null;
  valueSource:"reported"|"estimated"|"unavailable";
};

const volume=(v:number)=>new Intl.NumberFormat("id-ID",{notation:"compact",maximumFractionDigits:1}).format(v);
const money=(v:number|null)=>v===null||!Number.isFinite(v)?"N/D":marketCapText(v);
const txt={fontSize:23,color:"#f4f7f9",fontWeight:550} as const;
const cell=(width:number,more:Record<string,unknown>={})=>({
  display:"flex" as const,alignItems:"center" as const,width,flexShrink:0,
  paddingLeft:12,borderRight:"1px solid #34475a",...more
});

export async function renderMarketCard(title:string,rows:IssuerCardRow[]):Promise<Uint8Array> {
  const top=rows.filter(r=>/^[A-Z0-9]{4,6}$/.test(r.code) &&
    Number.isFinite(r.lastPrice) && r.lastPrice>0 && Number.isFinite(r.volume) && r.volume>0 &&
    Number.isFinite(r.changePct)).slice(0,10);
  if(!top.length) throw Error("No usable issuer rows for market card");
  const art=marketCardHeading(title);
  const logos=await Promise.all(top.map(r=>issuerLogoData(r.code)));
  const items=[
    {title:"#",width:66},{title:"EMITEN",width:273},{title:"HARGA",width:156},
    {title:"PERUBAHAN",width:156},{title:"VOLUME",width:160},
    {title:"NILAI TRANSAKSI",width:220},{title:"KAPITALISASI PASAR",width:239},
  ];
  const png=new ImageResponse(
    <PremiumFrame title={art.heading} clock={art.clock}
      accent={art.accent} preview={art.preview}
      footer="Market snapshot · provider delayed / indikatif">
      <div style={{display:"flex",width:"100%",flexDirection:"column",
        border:"1px solid #987847",borderRadius:25,padding:"11px 12px 13px",
        background:"linear-gradient(125deg,#061523 0%,#071b29 100%)"}}>
        <div style={{display:"flex",width:"100%",height:43,alignItems:"center",paddingLeft:10}}>
          {items.map((item,i)=><span key={item.title}
            style={{width:item.width,flexShrink:0,fontSize:i===6?14:17,
              letterSpacing:i===6?1:2.1,color:"#cbd6e2",fontWeight:500}}>
              {item.title}
            </span>)}
        </div>
        {top.map((r,i)=><div key={r.code} style={{display:"flex",alignItems:"center",
          height:67,marginBottom:3,padding:"0 10px",
          background:i===0?"linear-gradient(90deg,#312b23 0%,#0c1c26 78%)":
            i%2===0?"#091824":"#102433",
          border:i===0?"1px solid #d5a657":"1px solid #304457",
          borderRadius:17}}>
          <div style={{display:"flex",width:66,flexShrink:0,alignItems:"center",justifyContent:"center"}}>
            <span style={{display:"flex",width:42,height:42,borderRadius:22,
              alignItems:"center",justifyContent:"center",fontSize:20,
              color:i===0?"#f9db97":"#f1f5f8",
              background:i===0?"#655031":"#203646"}}>{i+1}</span>
          </div>
          <div style={cell(273)}>
            <IssuerMark ticker={r.code} data={logos[i]} size={46}/>
            <span style={{fontSize:24,fontWeight:800,color:"#ffffff"}}>{r.code}</span>
          </div>
          <div style={cell(156)}><span style={txt}>{rupiah(r.lastPrice)}</span></div>
          <div style={cell(156)}>
            <span style={{fontSize:22,fontWeight:700,color:r.changePct<0?"#ff6776":r.changePct>0?"#4ee7b2":"#b8c9d4"}}>
              {r.changePct<0?"▼ ":r.changePct>0?"▲ ":"• "}{decimalPct(r.changePct)}
            </span>
          </div>
          <div style={cell(160)}><span style={txt}>{volume(r.volume)}</span></div>
          <div style={{...cell(220),flexDirection:"column",alignItems:"flex-start",justifyContent:"center"}}>
            <span style={txt}>{money(r.tradedValue)}</span>
            <span style={{fontSize:13,color:"#98b0bd"}}>
              {r.valueSource==="reported"?"Dilaporkan":r.valueSource==="estimated"?"Estimasi":"Belum tersedia"}
            </span>
          </div>
          <div style={{...cell(239),borderRight:"none"}}>
            <span style={{...txt,fontSize:22}}>{money(r.marketCap)}</span>
          </div>
        </div>)}
      </div>
    </PremiumFrame>,{width:1448,height:1086}
  );
  return new Uint8Array(await png.arrayBuffer());
}
