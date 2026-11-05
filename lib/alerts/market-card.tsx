import "server-only";
import { ImageResponse } from "next/og";
import { marketCapText, rupiah } from "./market-rules";
import { decimalPct, marketCardHeading } from "./card-content";
import { IssuerMark, PremiumFrame, issuerLogoData } from "./premium-card-shell";
import { loadOswaldBold } from "./oswald-font";

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
  const [logos,oswald]=await Promise.all([
    Promise.all(top.map(r=>issuerLogoData(r.code))),
    loadOswaldBold(),
  ]);
  const headingFont=oswald?"Oswald":"Arial,sans-serif";
  const items=[
    {title:"#",width:68},{title:"EMITEN",width:302},{title:"HARGA",width:175},
    {title:"PERUBAHAN",width:172},{title:"VALUE (IDR)",width:235},
    {title:"VOLUME SHARES",width:190},{title:"KAPITALISASI PASAR",width:266},
  ];
  const png=new ImageResponse(
    <PremiumFrame title={art.heading} clock={art.clock} spacious headingFont={headingFont}
      accent={art.accent} preview={art.preview}
      footer="Market snapshot · provider delayed / indikatif">
      <div style={{display:"flex",width:"100%",flexDirection:"column",
        border:"1px solid #987847",borderRadius:25,padding:"13px 14px 16px",
        background:"linear-gradient(125deg,#061523 0%,#071b29 100%)"}}>
        <div style={{display:"flex",width:"100%",height:48,alignItems:"center",paddingLeft:12}}>
          {items.map((item,i)=><span key={item.title}
            style={{width:item.width,flexShrink:0,fontFamily:headingFont,
              fontSize:i===6?18:20,letterSpacing:i===6?1:1.2,
              color:"#e7d3ae",fontWeight:700}}>
              {item.title}
            </span>)}
        </div>
        {top.map((r,i)=><div key={r.code} style={{display:"flex",alignItems:"center",
          height:69,marginBottom:4,padding:"0 12px",
          background:i===0?"linear-gradient(90deg,#312b23 0%,#0c1c26 78%)":
            i%2===0?"#091824":"#102433",
          border:i===0?"1px solid #d5a657":"1px solid #304457",
          borderRadius:17}}>
          <div style={{display:"flex",width:68,flexShrink:0,alignItems:"center",justifyContent:"center"}}>
            <span style={{display:"flex",width:46,height:46,borderRadius:23,
              alignItems:"center",justifyContent:"center",fontSize:20,
              color:i===0?"#f9db97":"#f1f5f8",
              background:i===0?"#655031":"#203646"}}>{i+1}</span>
          </div>
          <div style={cell(302)}>
            <IssuerMark ticker={r.code} data={logos[i]} size={48}/>
            <span style={{fontSize:27,fontWeight:800,color:"#ffffff"}}>{r.code}</span>
          </div>
          <div style={cell(175)}><span style={txt}>{rupiah(r.lastPrice)}</span></div>
          <div style={cell(172)}>
            <span style={{fontSize:22,fontWeight:700,color:r.changePct<0?"#ff6776":r.changePct>0?"#4ee7b2":"#b8c9d4"}}>
              {r.changePct<0?"▼ ":r.changePct>0?"▲ ":"• "}{decimalPct(r.changePct)}
            </span>
          </div>
          <div style={{...cell(235),flexDirection:"column",alignItems:"flex-start",justifyContent:"center"}}>
            <span style={txt}>{money(r.tradedValue)}</span>
            <span style={{fontSize:13,color:"#98b0bd"}}>
              {r.valueSource==="reported"?"Dilaporkan":r.valueSource==="estimated"?"Estimasi":"Belum tersedia"}
            </span>
          </div>
          <div style={cell(190)}><span style={txt}>{volume(r.volume)}</span></div>
          <div style={{...cell(266),borderRight:"none"}}>
            <span style={{...txt,fontSize:22}}>{money(r.marketCap)}</span>
          </div>
        </div>)}
      </div>
    </PremiumFrame>,{
      width:1600,height:1200,
      fonts:oswald?[{name:"Oswald",data:oswald,weight:700,style:"normal"}]:undefined,
    }
  );
  return new Uint8Array(await png.arrayBuffer());
}
