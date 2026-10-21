import assert from "node:assert/strict";
import test from "node:test";
import { closingSlot,buildClosingDigest } from "../lib/alerts/closing-rules";

const when=(iso:string)=>new Date(iso);
const rows=Array.from({length:80},(_,i)=>({
  code:"X"+String(i).padStart(3,"0"),name:"Test "+i,date:"2026-10-21",
  close:i===0?135:100+i,previous:100,volume:1_000_000+i*1234,
  value:i===1?900e9:i===0?100e9:(80-i)*1e8,listedShares:1e9,
}));
const atClose=when("2026-10-21T09:30:00Z");

test("16:30 WIB closing slot only on scheduled weekdays, never holiday",()=>{
  assert.deepEqual(closingSlot(atClose),{date:"2026-10-21",key:"16:30"});
  assert.equal(closingSlot(when("2026-10-21T09:29:00Z")),null);
  assert.equal(closingSlot(when("2026-10-21T09:34:00Z")),null);
  assert.equal(closingSlot(when("2026-10-18T09:30:00Z")),null); // Sunday
  assert.equal(closingSlot(atClose,["2026-10-21"]),null);
});
test("summary ranks top 10 by BEI turnover, retains ARA/ARB and gainers/losers",()=>{
  const out=buildClosingDigest({now:atClose,date:"2026-10-21",rows,lookup:{}});
  assert.ok(out);
  assert.equal(out.kind,"MARKET_CLOSE");
  assert.equal(out.key,"market:2026-10-21:16:30:CLOSE");
  const imageRows=(out.embed as {_marketRows:{code:string;tradedValue:number}[]})._marketRows;
  assert.equal(imageRows.length,10);
  assert.equal(imageRows[0].code,"X001");
  assert.equal(imageRows[0].tradedValue,900e9);
  assert.match(String(out.embed.description),/Top 10 Nilai Transaksi/);
  assert.match(String(out.embed.description),/Top ARA \(indikatif\)/);
  assert.match(String(out.embed.description),/Top ARB \(indikatif\)/);
  assert.match(String(out.embed.description),/Top Gainers/);
  assert.match(String(out.embed.description),/Top Losers/);
  assert.match(String(out.embed.description),/\*\*Date\*\*\n\n21 Oktober 2026/);
});
test("closing fails closed for old BEI dates and incomplete source",()=>{
  assert.equal(buildClosingDigest({now:atClose,date:"2026-10-20",rows,lookup:{}}),null);
  assert.equal(buildClosingDigest({now:atClose,date:"2026-10-21",rows:rows.slice(0,10),lookup:{}}),null);
  assert.equal(buildClosingDigest({now:atClose,date:"2026-10-21",
    rows:rows.map(r=>({...r,date:"2026-10-20"})),lookup:{}}),null);
  assert.equal(buildClosingDigest({now:atClose,date:"2026-10-21",rows,lookup:{},holidays:["2026-10-21"]}),null);
});
