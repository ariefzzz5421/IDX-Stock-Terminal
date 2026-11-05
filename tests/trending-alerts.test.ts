import assert from "node:assert/strict";
import test from "node:test";
import { buildTrendingSignal, trendingSlot } from "../lib/alerts/trending-rules";
import type { TrendingStock } from "../lib/market-data/trending";

function sample(count=10):TrendingStock[]{
 return Array.from({length:count},(_,i)=>({
   code:"A"+String(i).padStart(3,"0"),name:"Issuer "+i,logoUrl:null,
   lastPrice:100+i,changePct:undefined,
   volume:1_000_000-i*100,turnover:2_000_000_000+i,
   marketCap:100e9+i*1e9,changes:{day:i%2?-2:4,week:null,month:null},
 } as TrendingStock));
}
const d=(iso:string)=>new Date(iso);

test("Trending :30 only during active BEI sessions and after 10:00 WIB",()=>{
  assert.equal(trendingSlot(d("2026-11-05T03:30:00Z"),"2026-11-05T03:30:00Z")?.key,"10:30");
  assert.equal(trendingSlot(d("2026-11-05T04:30:00Z"),"2026-11-05T04:30:00Z")?.key,"11:30");
  assert.equal(trendingSlot(d("2026-11-05T05:30:00Z"),"2026-11-05T05:30:00Z"),null); // Thu lunch
  assert.equal(trendingSlot(d("2026-11-05T06:30:00Z"),"2026-11-05T06:30:00Z")?.key,"13:30");
  assert.equal(trendingSlot(d("2026-11-05T07:30:00Z"),"2026-11-05T07:30:00Z")?.key,"14:30");
  assert.equal(trendingSlot(d("2026-11-05T08:30:00Z"),"2026-11-05T08:30:00Z")?.key,"15:30");
  assert.equal(trendingSlot(d("2026-11-06T04:30:00Z"),"2026-11-06T04:30:00Z"),null); // Friday break
  assert.equal(trendingSlot(d("2026-11-06T07:30:00Z"),"2026-11-06T07:30:00Z")?.key,"14:30");
  assert.equal(trendingSlot(d("2026-11-07T03:30:00Z"),"2026-11-07T03:30:00Z"),null); // weekend
  assert.equal(trendingSlot(d("2026-11-05T03:30:00Z"),"2026-11-05T03:30:00Z",["2026-11-05"]),null);
  assert.equal(trendingSlot(d("2026-11-05T03:29:00Z"),"2026-11-05T03:29:00Z"),null);
  assert.equal(trendingSlot(d("2026-11-05T03:33:00Z"),"2026-11-05T03:33:00Z"),null);
});

test("old scanner data and incomplete Top 10 fail closed",()=>{
  assert.equal(trendingSlot(d("2026-11-05T03:30:00Z"),"2026-11-05T03:23:00Z"),null);
  assert.equal(buildTrendingSignal({now:d("2026-11-05T03:30:00Z"),
    fetchedAt:"2026-11-05T03:30:00Z",stocks:sample(9)}),null);
  assert.equal(buildTrendingSignal({now:d("2026-11-05T03:30:00Z"),
    fetchedAt:"2026-11-05T03:30:00Z",stocks:sample().map((x,i)=>i===0?{...x,lastPrice:null}:x)}),null);
});
test("Trending uses exact Market Tape ranking, not reordered by turnover",()=>{
  const stock=sample();
  // First issuer has the highest share volume but the smallest IDR turnover.
  stock[0].turnover=100;
  stock[1].turnover=1_000_000_000_000;
  const now=d("2026-11-05T03:30:00Z");
  const a=buildTrendingSignal({now,fetchedAt:now.toISOString(),stocks:stock});
  assert.ok(a);
  assert.equal(a.key,"market:2026-11-05:10:30:TRENDING");
  assert.match(a.embed.title,/TOP 10 TRENDING/);
  assert.equal(a.embed._marketRows[0].code,"A000");
  assert.equal(a.embed._marketRows[1].code,"A001");
  assert.match(a.embed.description,/Market Tape/);
  assert.match(a.embed.description,/Volume Shares/);
  const repeat=buildTrendingSignal({now:d("2026-11-05T03:31:00Z"),
    fetchedAt:"2026-11-05T03:31:00Z",stocks:stock});
  assert.equal(repeat?.key,a.key);
});
test("Trending preview clearly labeled as not verified and no live trading claim",()=>{
  const a=buildTrendingSignal({now:d("2026-11-07T03:30:00Z"),
    fetchedAt:"2026-11-04T03:30:00Z",stocks:sample(),preview:true});
  assert.ok(a);
  assert.match(a.embed.title,/PREVIEW ONLY/);
});
