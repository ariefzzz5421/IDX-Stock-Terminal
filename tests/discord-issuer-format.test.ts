import assert from "node:assert/strict";
import test from "node:test";
import { discordIssuerHeadline, discordIssuerRow, buildMarketSignals } from "../lib/alerts/market-rules";
import { issuerDescription } from "../lib/alerts/intraday-rules";

test("Discord issuer row has bold #rank/ticker, price, percent and all three metrics",()=>{
  const row=discordIssuerRow({
    rank:1,code:"BBCA",price:4000,changePct:4,marketCap:87e12,
    tradedValue:100e9,volume:120e6,valueSource:"reported",
  });
  assert.equal(row,[
    "**#1 BBCA** ~ **Rp4.000** ~ 🟢 **+4,00%**",
    "MCap **Rp87 T**",
    "Volume Transaksi **Rp100 M**",
    "Volume Shares **120 jt shares**",
  ].join("\n"));
});

test("negative/flat changes are clearly distinguished and estimation remains labeled",()=>{
  assert.match(discordIssuerHeadline(2,"TAXI",10,-9.09),
    /^\*\*#2 TAXI\*\* ~ \*\*Rp10\*\* ~ 🔴 \*\*-9,09%\*\*$/);
  assert.match(discordIssuerHeadline(3,"GOTO",25,0),
    /^\*\*#3 GOTO\*\* ~ \*\*Rp25\*\* ~ ⚪ \*\*\+0,00%\*\*$/);
  const row=discordIssuerRow({rank:5,code:"BUMI",price:120,changePct:-1.5,
    marketCap:null,tradedValue:120000000,volume:1000000,valueSource:"estimated"});
  assert.match(row,/MCap \*\*N\/D\*\*/);
  assert.match(row,/Volume Transaksi \*\*Rp120\.000\.000\*\* _\(estimasi\)_/);
  assert.match(row,/Volume Shares \*\*1 jt shares\*\*/);
});

test("intra/ARA/ARB/trending shared formatter leaves exactly one blank line between issuer blocks",()=>{
  const rows=issuerDescription([
    {code:"BBCA",name:"Bank",lastPrice:4000,changePct:4,marketCap:87e12,
      volume:120e6,tradedValue:100e9,valueSource:"reported"},
    {code:"TAXI",name:"Company",lastPrice:10,changePct:-9.09,marketCap:1e9,
      volume:49.5e6,tradedValue:495e6,valueSource:"reported"},
  ]);
  assert.match(rows,/\*\*#1 BBCA\*\*/);
  assert.match(rows,/\nVolume Shares \*\*120 jt shares\*\*\n\n\*\*#2 TAXI\*\*/);
  assert.ok(!rows.includes("\n\n\n"));
});

test("optional official BEI gainers/losers digests also use same readable layout",()=>{
  const date="2026-11-05";
  const rows=Array.from({length:80},(_,i)=>({
    code:"A"+String(i).padStart(3,"0"),name:"Issuer",date,
    close:i<40?110:90,previous:100,volume:1e6,value:1e9,listedShares:1e9,
  }));
  const out=buildMarketSignals({rows,date,lookup:{},now:new Date("2026-11-05T09:30:00Z"),
    mode:"close",count:10,digestEnabled:true,limitsEnabled:false});
  assert.equal(out.length,2);
  for(const signal of out){
    const description=String(signal.embed.description);
    assert.match(description,/\*\*#1 A\d{3}\*\* ~ \*\*Rp/);
    assert.match(description,/\nMCap \*\*Rp/);
    assert.match(description,/\nVolume Transaksi \*\*Rp/);
    assert.match(description,/\nVolume Shares \*\*1 jt shares\*\*/);
  }
});
