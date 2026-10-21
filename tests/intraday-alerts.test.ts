import assert from "node:assert/strict";
import test from "node:test";
import { intradaySlot, buildIntradaySignals, formattedTradingDate, issuerDescription, tradedValueFor } from "../lib/alerts/intraday-rules";
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
test("Top 10 volume starts at 10:00 WIB and remains hourly in active sessions",()=>{
  assert.equal(build("2026-10-16T02:00:00Z").length,0); // Friday 09:00
  assert.equal(build("2026-10-16T02:10:00Z").length,0); // Friday 09:10
  const ten=build("2026-10-16T03:00:00Z"); // Friday 10:00
  assert.deepEqual(ten.map(x=>x.kind),["MARKET_VOLUME"]);
  assert.equal(ten[0].key,"market:2026-10-16:10:00:VOLUME");
  assert.match(String(ten[0].embed.description),/MCap Rp/);
  assert.match(String(ten[0].embed.description),/Vol/);
  assert.equal(build("2026-10-16T03:10:00Z").some(x=>x.kind==="MARKET_VOLUME"),false);
  assert.equal(build("2026-10-16T03:05:00Z").length,0);
  assert.equal(build("2026-10-16T04:00:00Z").filter(x=>x.kind==="MARKET_VOLUME").length,1); // 11:00 Fri
  assert.equal(build("2026-10-16T07:00:00Z").filter(x=>x.kind==="MARKET_VOLUME").length,1); // 14:00
  assert.equal(build("2026-10-16T08:00:00Z").filter(x=>x.kind==="MARKET_VOLUME").length,1); // 15:00
});
test("ARA and ARB indicative are due at 10:10, 11:10, 14:10, 15:10 WIB only",()=>{
  const now=at("2026-10-16T03:10:00Z");
  const ten=intradaySlot(at("2026-10-16T03:00:00Z"),"2026-10-16T03:00:00Z");
  const limit=intradaySlot(now,now.toISOString());
  assert.ok(ten);
  assert.equal(ten.hourly,true);
  assert.equal(ten.limitsDue,false);
  assert.ok(limit);
  assert.equal(limit.hourly,false);
  assert.equal(limit.limitsDue,true);
  assert.equal(limit.key,"10:10");
  assert.equal(intradaySlot(at("2026-10-16T03:05:00Z"),"2026-10-16T03:05:00Z"),null);
  assert.equal(intradaySlot(at("2026-10-16T03:15:00Z"),"2026-10-16T03:15:00Z"),null);
  assert.equal(intradaySlot(at("2026-10-16T02:10:00Z"),"2026-10-16T02:10:00Z"),null);
  assert.equal(intradaySlot(at("2026-10-16T04:10:00Z"),"2026-10-16T04:10:00Z")?.limitsDue,true);
  assert.equal(intradaySlot(at("2026-10-16T07:10:00Z"),"2026-10-16T07:10:00Z")?.limitsDue,true);
  assert.equal(intradaySlot(at("2026-10-16T08:10:00Z"),"2026-10-16T08:10:00Z")?.limitsDue,true);
  assert.equal(build("2026-10-16T03:10:00Z").length,0); // no qualifying stocks
});
test("no market alerts outside sessions and Friday lunch",()=>{
  assert.equal(build("2026-10-16T04:35:00Z").length,0); // Fri 11:35 break
  assert.equal(build("2026-10-15T05:10:00Z").length,0); // Thu 12:05 break
  assert.equal(build("2026-10-16T09:10:00Z").length,0); // 16:05
  assert.equal(build("2026-10-17T03:10:00Z").length,0); // Saturday
  assert.equal(build("2026-10-16T03:10:00Z",{holidays:["2026-10-16"]}).length,0);
});
test("stale snapshot and partial/invalid volume fail closed",()=>{
  assert.equal(buildIntradaySignals({now:at("2026-10-16T03:10:00Z"),
    fetchedAt:"2026-10-15T03:10:00Z",stocks,volumeEnabled:true,
    araEnabled:true,arbEnabled:true,marketTopCount:10}).length,0);
  assert.equal(build("2026-10-16T03:10:00Z",{stocks:stocks.slice(0,25)}).length,0);
});
test("once-per-time-slot keys; preview never enters normal market key namespace",()=>{
  const first=build("2026-10-16T03:00:01Z");
  const repeat=build("2026-10-16T03:02:30Z");
  assert.equal(first[0].key,repeat[0].key);
  const other=build("2026-10-16T04:00:00Z");
  assert.notEqual(first[0].key,other[0].key);
  const p=build("2026-10-17T03:10:00Z",{preview:true});
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
  const result=build("2026-10-16T03:00:00Z");
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

test("indicative ARA and ARB emit separate Top 10 embeds at 10:10 only",()=>{
  const source=stocks.map((row,i)=>i===0
    ? {...row,code:"BBCA",lastPrice:135,changePct:35}
    : i===1 ? {...row,code:"BBRI",lastPrice:85,changePct:-15} : row);
  const due=build("2026-10-16T03:10:00Z",{stocks:source});
  assert.deepEqual(due.map(x=>x.kind).sort(),["MARKET_ARA","MARKET_ARB"]);
  assert.equal(due.find(x=>x.kind==="MARKET_ARA")?.key,"market:2026-10-16:10:10:ARA");
  assert.equal(due.find(x=>x.kind==="MARKET_ARB")?.key,"market:2026-10-16:10:10:ARB");
  assert.equal(build("2026-10-16T03:00:00Z",{stocks:source}).filter(x=>x.kind!=="MARKET_VOLUME").length,0);
  assert.equal(build("2026-10-16T03:05:00Z",{stocks:source}).length,0);
  assert.equal(build("2026-10-16T03:15:00Z",{stocks:source}).length,0);
});
test("Discord market alert is readable on mobile with one blank line between stocks",()=>{
  const alert=build("2026-10-16T03:00:00Z")[0];
  const body=String(alert.embed.description);
  const rows=issuerDescription(alert.rows);
  assert.match(rows,/1\. \*\*A/);
  assert.match(rows,/\n(?:Value|Est\. Value) Rp[^\n]+ \| Volume Shares [^\n]+\nMCap Rp/);
  assert.match(rows,/\nMCap Rp[^\n]+\n\n2\. \*\*/);
  assert.ok(!rows.includes("\n\n\n")); // only one empty row between emitters
  assert.match(body,/\n\n\*\*Date\*\*\n16 Oktober 2026\n\n\*\*Source\*\*\n\[IDX Terminal\]\(https:\/\/idx-stock-terminal\.vercel\.app\/market\)/);
  assert.ok(!body.includes("TradingView scanner"));
  assert.equal(Object.hasOwn(alert.embed,"footer"),false);
  assert.equal(Object.hasOwn(alert.embed,"fields"),false);
  assert.equal(issuerDescription([]),"");
  assert.ok(Array.isArray((alert.embed as {_marketRows?:unknown[]})._marketRows));
});
test("Date label is computed in WIB rather than the VPS timezone",()=>{
  assert.equal(formattedTradingDate("2026-10-21"),"21 Oktober 2026");
  assert.equal(formattedTradingDate("2026-11-10"),"10 November 2026");
  assert.equal(formattedTradingDate("2026-01-01"),"1 Januari 2026");
});

test("Top 10 volume is ranked by traded IDR value rather than number of shares",()=>{
  const candidates=stocks.map((r,i)=>({
    ...r,volume:i===0?999_000_000:10_000_000+i*100,
    turnover:i===1?900_000_000_000:i===0?100_000_000:i*1_000_000,
  }));
  const result=build("2026-10-16T03:00:00Z",{stocks:candidates});
  const top=result.find(x=>x.kind==="MARKET_VOLUME");
  assert.ok(top);
  assert.equal(top.rows[0].code,"A001");
  assert.notEqual(top.rows[0].code,"A000");
  assert.match(String(top.embed.description),/1\. \*\*A001\*\* Rp/);
  assert.match(String(top.embed.description),/ ~ \+2,00%/);
  assert.ok(!String(top.embed.description).includes("**A001** ·"));
});
