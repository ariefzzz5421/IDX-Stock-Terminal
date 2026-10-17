import assert from "node:assert/strict";
import test from "node:test";
import { intradaySlot, buildIntradaySignals, tradedValueFor } from "../lib/alerts/intraday-rules";
import { safeLogoSvg } from "../lib/alerts/svg-safety";
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
test("Top 10 volume is sent hourly at :00, not at :05 or :10",()=>{
  const atNine=build("2026-10-16T02:00:00Z"); // Fri 09:00 WIB
  assert.deepEqual(atNine.map(x=>x.kind),["MARKET_VOLUME"]);
  assert.equal(atNine[0].key,"market:2026-10-16:09:00:VOLUME");
  assert.match(String(atNine[0].embed.description),/MCap Rp/);
  assert.match(String(atNine[0].embed.description),/Vol/);
  assert.equal(build("2026-10-16T02:05:00Z").some(x=>x.kind==="MARKET_VOLUME"),false);
  assert.equal(build("2026-10-16T02:10:00Z").length,0);
  assert.equal(build("2026-10-16T03:00:00Z").filter(x=>x.kind==="MARKET_VOLUME").length,1);
  assert.equal(build("2026-10-16T07:00:00Z").filter(x=>x.kind==="MARKET_VOLUME").length,1);
  assert.equal(build("2026-10-16T08:00:00Z").filter(x=>x.kind==="MARKET_VOLUME").length,1);
});
test("ARA and ARB indicative are due only at :05 per active hour",()=>{
  const atNine=intradaySlot(at("2026-10-16T02:00:00Z"),"2026-10-16T02:00:00Z");
  const atNineFive=intradaySlot(at("2026-10-16T02:05:00Z"),"2026-10-16T02:05:00Z");
  assert.ok(atNine);
  assert.equal(atNine.hourly,true);
  assert.equal(atNine.limitsDue,false);
  assert.ok(atNineFive);
  assert.equal(atNineFive.hourly,false);
  assert.equal(atNineFive.limitsDue,true);
  assert.equal(atNineFive.key,"09:05");
  assert.equal(intradaySlot(at("2026-10-16T02:10:00Z"),"2026-10-16T02:10:00Z"),null);
  // The price-limit feed must not fabricate alerts when no ticker has hit a limit.
  assert.equal(build("2026-10-16T02:05:00Z").length,0);
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
  const first=build("2026-10-16T02:00:01Z");
  const repeat=build("2026-10-16T02:02:30Z");
  assert.equal(first[0].key,repeat[0].key);
  const other=build("2026-10-16T03:00:00Z");
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
  const result=build("2026-10-16T02:00:00Z");
  const volume=result.find(x=>x.kind==="MARKET_VOLUME");
  assert.ok(volume);
  assert.equal(volume.rows.length,10);
  assert.match(String(volume.embed.description),/Est\. Value/);
  const e=volume.embed as { _marketRows?:unknown[] };
  assert.equal(e._marketRows?.length,10);
});

test("trusted SVG data accepts static shapes but rejects active or external content",()=>{
  assert.equal(safeLogoSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path fill="#fff" d="M0 0h40v40H0z"/></svg>'),true);
  assert.equal(safeLogoSvg('<svg><script>alert(1)</script></svg>'),false);
  assert.equal(safeLogoSvg('<svg><image href="https://evil.test/track"/></svg>'),false);
  assert.equal(safeLogoSvg('<svg onload="evil()"></svg>'),false);
});

test("indicative ARA and ARB emit two separate top-10 embeds only at hourly :05",()=>{
  const source=stocks.map((row,i)=>i===0
    ? {...row,code:"BBCA",lastPrice:135,changePct:35}
    : i===1 ? {...row,code:"BBRI",lastPrice:85,changePct:-15} : row);
  const due=build("2026-10-16T02:05:00Z",{stocks:source});
  assert.deepEqual(due.map(x=>x.kind).sort(),["MARKET_ARA","MARKET_ARB"]);
  assert.equal(due.find(x=>x.kind==="MARKET_ARA")?.key,"market:2026-10-16:09:05:ARA");
  assert.equal(due.find(x=>x.kind==="MARKET_ARB")?.key,"market:2026-10-16:09:05:ARB");
  assert.equal(build("2026-10-16T02:00:00Z",{stocks:source}).filter(x=>x.kind!=="MARKET_VOLUME").length,0);
  assert.equal(build("2026-10-16T02:10:00Z",{stocks:source}).length,0);
});
