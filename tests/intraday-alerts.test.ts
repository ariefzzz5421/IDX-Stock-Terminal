import assert from "node:assert/strict";
import test from "node:test";
import { intradaySlot, buildIntradaySignals, tradedValueFor } from "../lib/alerts/intraday-rules";
function at(iso:string){return new Date(iso);}
const stocks=Array.from({length:80},(_,i)=>({
  code:"A"+String(i).padStart(3,"0"),name:"Issuer "+i,lastPrice:100+i,
  volume:1_000_000+i*200,marketCap:(100+i)*1e9,changePct:i%2?2:-1,
}));
function build(iso:string,extra:Record<string,unknown>={}) {
  const now=at(iso);
  return buildIntradaySignals({now,fetchedAt:now.toISOString(),stocks,
    marketTopCount:10,volumeEnabled:true,araEnabled:true,arbEnabled:true,...extra});
}
test("hourly volume exactly the first five-minute bucket :05",()=>{
  const t="2026-10-16T02:05:00Z"; // Fri 09:05 WIB
  const r=build(t);
  assert.equal(r.filter(x=>x.kind==="MARKET_VOLUME").length,1);
  assert.match(String(r[0].embed.description),/MCap Rp/);
  assert.match(String(r[0].embed.description),/Vol/);
  assert.equal(build("2026-10-16T02:10:00Z").filter(x=>x.kind==="MARKET_VOLUME").length,0);
  assert.equal(build("2026-10-16T03:05:00Z").filter(x=>x.kind==="MARKET_VOLUME").length,1);
  assert.equal(build("2026-10-16T07:05:00Z").filter(x=>x.kind==="MARKET_VOLUME").length,1);
});
test("no market alerts outside sessions and Friday lunch",()=>{
  assert.equal(build("2026-10-16T04:35:00Z").length,0); // Fri 11:35 break
  assert.equal(build("2026-10-15T05:05:00Z").length,0); // Thu 12:05 break
  assert.equal(build("2026-10-16T09:05:00Z").length,0); // 16:05
  assert.equal(build("2026-10-17T02:05:00Z").length,0); // Saturday
  assert.equal(build("2026-10-16T02:05:00Z",{holidays:["2026-10-16"]}).length,0);
});
test("stale snapshot and partial/invalid volume fail closed",()=>{
  assert.equal(buildIntradaySignals({now:at("2026-10-16T02:05:00Z"),
    fetchedAt:"2026-10-15T02:05:00Z",stocks,volumeEnabled:true,
    araEnabled:true,arbEnabled:true,marketTopCount:10}).length,0);
  assert.equal(build("2026-10-16T02:05:00Z",{stocks:stocks.slice(0,25)}).length,0);
});
test("once-per-time-slot keys; preview never enters normal market key namespace",()=>{
  const first=build("2026-10-16T02:05:01Z");
  const repeat=build("2026-10-16T02:08:30Z");
  assert.equal(first[0].key,repeat[0].key);
  const other=build("2026-10-16T03:05:00Z");
  assert.notEqual(first[0].key,other[0].key);
  const p=build("2026-10-17T02:05:00Z",{preview:true});
  assert.ok(p.length>0);
  assert.match(String(p[0].embed.title),/PREVIEW ONLY/);
});

test("estimated IDR traded value equals volume in shares multiplied by price",()=>{
  const input={code:"BBCA",name:"Bank",lastPrice:5175,volume:1_200_000,
    marketCap:700e12,changePct:1.5};
  assert.deepEqual(tradedValueFor(input),{value:6_210_000_000,source:"estimated"});
  assert.deepEqual(tradedValueFor({...input,turnover:6_100_000_000}),
    {value:6_100_000_000,source:"reported"});
  assert.deepEqual(tradedValueFor({...input,lastPrice:null,turnover:0}),
    {value:null,source:"unavailable"});
});
test("market embeds contain per-issuer rows and value-source labels",()=>{
  const result=build("2026-10-16T02:05:00Z");
  const volume=result.find(x=>x.kind==="MARKET_VOLUME");
  assert.ok(volume);
  assert.equal(volume.rows.length,10);
  assert.match(String(volume.embed.description),/Est\. Value/);
  const e=volume.embed as { _marketRows?:unknown[] };
  assert.equal(e._marketRows?.length,10);
});
