import { createHash } from "node:crypto";
import { safeHttpsUrl } from "./rules";

export type NewsSource = {
  sourceDocumentId:string;title:string;sourceUrl:string;adapter:string;
  status:string;aiStatus:string|null;aiSummary:string|null;
  publishedAt:Date|null;fetchedAt:Date;
};
const OFFICIAL_HOSTS=new Set([
  "web.ksei.co.id","ksei.co.id","www.ksei.co.id",
  "idx.co.id","www.idx.co.id","ojk.go.id","www.ojk.go.id",
  "msci.com","www.msci.com","lseg.com","www.lseg.com",
  "vaneck.com","www.vaneck.com"
]);

export function eligibleNewsSource(source:NewsSource,now:Date):boolean {
  const age=now.getTime()-source.fetchedAt.getTime();
  if(!Number.isFinite(age)||age<0||age>3*60*60_000) return false;
  if(source.status==="UNAVAILABLE"||source.status==="ERROR") return false;
  const url=safeHttpsUrl(source.sourceUrl);
  if(!url) return false;
  return OFFICIAL_HOSTS.has(new URL(url).hostname);
}
export function newsSourceKey(id:string):string {
 return "news:"+createHash("sha256").update(id).digest("hex");
}
export function tickerInNewsTitle(title:string):string|null {
 // KSEI often ends titles with "(TICKER)" and that is not the AI's prediction.
 const match=title.match(/\(([A-Z]{4,5})\)/);
 return match?.[1]??null;
}
function clean(value:string,max:number){
 return value.replace(/@/g,"@\u200b").replace(/[\u0000-\u001f\u007f]/g," ")
   .replace(/\s+/g," ").trim().slice(0,max);
}
export function marketNewsEmbed(source:NewsSource){
 const href=safeHttpsUrl(source.sourceUrl);
 if(!href || !OFFICIAL_HOSTS.has(new URL(href).hostname)) throw Error("Source URL not verified");
 const status=source.aiStatus==="CONFIRMED"?"AI SUMMARY AVAILABLE":
   "SOURCE DISCOVERED · AI NOT CONFIRMED";
 const sourceDate=source.publishedAt
  ?new Intl.DateTimeFormat("id-ID",{timeZone:"Asia/Jakarta",day:"numeric",month:"long",year:"numeric"}).format(source.publishedAt)
  :"Tanggal publikasi belum terverifikasi";
 const description=source.aiSummary
  ? clean(source.aiSummary,900)
  : "Dokumen sumber baru terdeteksi oleh IDX Terminal. Ringkasan AI belum tersedia atau belum terverifikasi.";
 return {
   title:("IDX Market News · "+clean(source.title,210)).slice(0,256),
   url:href,
   description:description+"\n\n**"+status+"**",
   color:0xd9ad6b,
   fields:[
     {name:"Emiten",value:tickerInNewsTitle(source.title)??"Belum teridentifikasi",inline:true},
     {name:"Sumber",value:clean(source.adapter,90),inline:true},
     {name:"Tanggal publikasi",value:sourceDate,inline:false},
     {name:"Artikel / dokumen",value:"[Buka sumber asli]("+href+")",inline:false},
   ],
   footer:{text:"IDX Terminal · Dokumen sumber, bukan konfirmasi aksi korporasi atau rekomendasi investasi"},
   timestamp:new Date().toISOString(),
 };
}
