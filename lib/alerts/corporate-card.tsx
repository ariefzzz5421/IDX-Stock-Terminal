import "server-only";
import { ImageResponse } from "next/og";
import { PremiumFrame, IssuerMark, issuerLogoData } from "./premium-card-shell";
import { corporateActionLabel, dateWibForCard, shortCardText } from "./card-content";
import { marketCapText } from "./market-rules";

export type CorporateCardData = {
 title:string; summary:string; category:string; priority:string; status:string;
 codes:Array<{ticker:string;name:string;marketCap:number|null}>;
 sourceUrl:string|null;
 publishedAt:string|null; announcementAt:string|null; effectiveAt:string|null;
 whatChanged?:string|null; materiality?:string|null;
};
const labelStyle={fontSize:17,letterSpacing:2,color:"#94b3c9"} as const;
const valueStyle={fontSize:29,fontWeight:700,color:"#f6f6f6"} as const;

function EventSection({label,children,width}:{label:string;children:React.ReactNode;width:number}) {
 return <div style={{display:"flex",flexDirection:"column",width,flexShrink:0,
   padding:"0 20px",borderRight:"1px solid #3b5561"}}>
   <span style={labelStyle}>{label}</span>
   <span style={{...valueStyle,marginTop:16}}>{children}</span>
 </div>;
}

export async function renderCorporateCard(data:CorporateCardData):Promise<Uint8Array> {
  const codes=data.codes.filter(x=>/^[A-Z0-9]{4,6}$/.test(x.ticker)).slice(0,4);
  const displayed=codes.length?codes:[{ticker:"IDX",name:"Informasi korporasi",marketCap:null}];
  const logos=await Promise.all(displayed.map(x=>issuerLogoData(x.ticker)));
  const primary=displayed[0];
  const day=dateWibForCard(data.announcementAt ?? data.publishedAt);
  const effective=dateWibForCard(data.effectiveAt);
  const eventType=corporateActionLabel(data.category);
  const sourceName=(()=>{
    if(!data.sourceUrl) return "Dokumen sumber tidak tersedia";
    try{return new URL(data.sourceUrl).hostname.replace(/^www\./,"");}catch{return "Dokumen sumber tidak tersedia";}
  })();
  const watchText=shortCardText(data.materiality??data.whatChanged??"",260);
  const render=new ImageResponse(
   <PremiumFrame title="CORPORATE ACTION ALERT" accent="#f2cf8e"
     subtitle={eventType+" · "+shortCardText(data.priority,20)+" · "+shortCardText(data.status,20)}
     footer="Corporate intelligence · verifikasi mengikuti sumber">
      <div style={{display:"flex",flexDirection:"column",flexGrow:1,
        padding:"18px 23px 22px",background:"linear-gradient(140deg,#081b2a,#071422)",
        border:"1px solid #b58d4a",borderRadius:24}}>
        <div style={{display:"flex",flexDirection:"row",alignItems:"center",
          height:152,borderBottom:"1px solid #486072"}}>
          <div style={{display:"flex",flexDirection:"column",width:320,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center"}}>
              <IssuerMark ticker={primary.ticker} data={logos[0]} size={72}/>
              <div style={{display:"flex",flexDirection:"column"}}>
                <span style={{fontSize:40,fontWeight:800}}>{primary.ticker}</span>
                <span style={{fontSize:16,color:"#adc3d2",maxWidth:190}}>
                  {shortCardText(primary.name,52)}
                </span>
              </div>
            </div>
            {displayed.length>1&&<span style={{fontSize:14,color:"#d4b678",marginTop:7}}>
              Terkait: {displayed.slice(1).map(x=>x.ticker).join(", ")}
              {data.codes.length>4?" dan lainnya":""}
            </span>}
          </div>
          <EventSection label="JENIS AKSI" width={262}>
            <span style={{fontSize:23,color:"#f6ca82"}}>{eventType}</span>
          </EventSection>
          <EventSection label="TANGGAL SUMBER" width={250}>{day}</EventSection>
          <EventSection label="MCAP REFERENSI" width={330}>
            {marketCapText(primary.marketCap)}
          </EventSection>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"15px 0 17px",
          borderBottom:"1px solid #344c5c",alignItems:"center"}}>
          <div style={{display:"flex",flexDirection:"column",width:650}}>
            <span style={labelStyle}>PERISTIWA</span>
            <span style={{fontSize:29,fontWeight:650,color:"#fbf4e8",marginTop:10}}>
              {shortCardText(data.title,105)}
            </span>
          </div>
          <div style={{display:"flex",flexDirection:"column",width:345}}>
            <span style={labelStyle}>TANGGAL EFEKTIF</span>
            <span style={{fontSize:26,fontWeight:600,marginTop:13}}>{effective}</span>
            <span style={{fontSize:15,color:"#90abbc",marginTop:7}}>N/D jika belum diumumkan</span>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",padding:"18px 0 14px",
          borderBottom:"1px solid #344c5c"}}>
          <span style={{...labelStyle,color:"#e9c283"}}>RINGKASAN ARTIKEL / KETERBUKAAN</span>
          <span style={{fontSize:24,color:"#f5f9fa",lineHeight:1.43,marginTop:13}}>
            {shortCardText(data.summary,320)}
          </span>
        </div>
        {watchText!=="N/D"&&<div style={{display:"flex",flexDirection:"column",paddingTop:17}}>
          <span style={labelStyle}>KONTEKS & MATERIALITAS</span>
          <span style={{fontSize:21,color:"#dce8ed",lineHeight:1.32,marginTop:8}}>
            {watchText}
          </span>
        </div>}
        <div style={{display:"flex",flexDirection:"row",justifyContent:"space-between",
          padding:"15px 18px",marginTop:"auto",borderRadius:13,
          background:"#0d2a3b",border:"1px solid #516579"}}>
          <div style={{display:"flex",flexDirection:"column",maxWidth:860}}>
            <span style={{fontSize:18,fontWeight:700,color:"#eac281"}}>ARTIKEL / SUMBER ASLI</span>
            <span style={{fontSize:18,marginTop:6,color:"#dbe5e8"}}>{sourceName}</span>
          </div>
          <span style={{fontSize:18,color:"#b7d2e5",marginTop:8}}>Buka dokumen dari tautan di pesan Discord ↗</span>
        </div>
      </div>
   </PremiumFrame>,{width:1448,height:1086});
  return new Uint8Array(await render.arrayBuffer());
}
