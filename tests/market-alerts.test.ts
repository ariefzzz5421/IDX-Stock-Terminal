import assert from "node:assert/strict";
import test from "node:test";
import { buildMarketSignals, marketCapText, marketCandidates, jakartaDate } from "../lib/alerts/market-rules";

function sample(code:string, close:number, previous:number, date="2026-10-16", shares=1e9) {
  return {code,name:code,date,close,previous,volume:20000,value:1e9,listedShares:shares};
}
test("market caps format in IDR, including unavailable values",()=>{
  assert.equal(marketCapText(1.2e12),"Rp1,2 T");
  assert.equal(marketCapText(750e9),"Rp750 M");
  assert.equal(marketCapText(null),"N/D");
});
test("market ranking and caps use official shares x latest price",()=>{
  const data=marketCandidates([sample("ABCD",120,100),sample("WXYZ",80,100)],"2026-10-16",{},5);
  assert.equal(data.gainers[0].code,"ABCD");
  assert.equal(data.gainers[0].cap.value,120e9);
  assert.equal(data.losers[0].code,"WXYZ");
});
test("never broadcast old trading dates or early digest",()=>{
  const now=new Date("2026-10-16T14:00:00Z"); // 21:00 WIB
  const rows=[sample("ABCD",120,100,"2026-10-15")];
  assert.equal(buildMarketSignals({rows,date:"2026-10-15",lookup:{},now,mode:"close",count:5,digestEnabled:true,limitsEnabled:true}).length,0);
  assert.equal(buildMarketSignals({rows,date:jakartaDate(now),lookup:{},now:new Date("2026-10-16T06:00:00Z"),mode:"close",count:5,digestEnabled:true,limitsEnabled:true}).length,0);
});
test("snapshot with too few issuers does not create live notifications",()=>{
  const now=new Date("2026-10-16T14:00:00Z");
  const signals=buildMarketSignals({rows:[sample("ABCD",120,100)],date:"2026-10-16",lookup:{},now,mode:"close",count:5,digestEnabled:true,limitsEnabled:false});
  assert.equal(signals.length,0);
});
test("preview is labeled and does not require current trading date",()=>{
  const out=buildMarketSignals({rows:[sample("ABCD",120,100)],date:"2026-10-15",lookup:{},now:new Date("2026-10-16T14:00:00Z"),mode:"close",count:5,digestEnabled:true,limitsEnabled:false,preview:true});
  assert.equal(out.length,1);
  assert.match(String(out[0].embed.title),/PREVIEW ONLY/);
});
