import assert from "node:assert/strict";
import test from "node:test";
import { discordIssuerHeadline, discordIssuerRow, buildMarketSignals } from "../lib/alerts/market-rules";
import { issuerDescription } from "../lib/alerts/intraday-rules";

test("Discord format shows ranked ticker, price, percent and the exact metric order",()=>{
  const row=discordIssuerRow({
    rank:10,code:"DEWA",price:218,changePct:-5.22,marketCap:13.09e12,
    tradedValue:47.35e9,volume:217.2e6,valueSource:"reported",
  });
  assert.equal(row,[
    "**#10. DEWA** | **Rp 218** | **-5,22%** 🔴",
    "MCap | **13,09T**",
    "Volume Transaksi | **Rp 47,35 M**",
    "Volume Shares | **217,2 Jt Shares**",
  ].join("\n"));
  assert.ok(row.includes("🔴")&&!row.includes("🟢"));
});

test("all percentage signs and large/small share volumes remain readable",()=>{
  assert.equal(discordIssuerHeadline(1,"BBCA",4000,4),
    "**#1. BBCA** | **Rp 4.000** | **+4,00%** 🟢");
  assert.equal(discordIssuerHeadline(2,"TAXI",10,-9.09),
    "**#2. TAXI** | **Rp 10** | **-9,09%** 🔴");
  assert.equal(discordIssuerHeadline(3,"GOTO",25,0),
    "**#3. GOTO** | **Rp 25** | **+0,00%**");
  assert.equal(discordIssuerHeadline(4,"BBCA",4000,Number.NaN),
    "**#4. BBCA** | **Rp 4.000** | **N/D**");
  const est=discordIssuerRow({rank:5,code:"BUMI",price:120,changePct:-1.5,
    marketCap:null,tradedValue:120000000,volume:1e9,valueSource:"estimated"});
  assert.match(est,/MCap \| \*\*N\/D\*\*/);
  assert.match(est,/Volume Transaksi \| \*\*Rp 120\.000\.000\*\* _\(estimasi\)_/);
  assert.match(est,/Volume Shares \| \*\*1 M Shares\*\*/);
  assert.match(discordIssuerRow({rank:6,code:"BBRI",price:100,changePct:1,
    marketCap:0,tradedValue:null,volume:125e3}),/Volume Shares \| \*\*125 Rb Shares\*\*/);
});

test("shared Volume / ARA / ARB / Trending block has one blank line between issuers",()=>{
  const rows=issuerDescription([
    {code:"BBCA",name:"Bank",lastPrice:4000,changePct:4,marketCap:87e12,
      volume:120e6,tradedValue:100e9,valueSource:"reported"},
    {code:"TAXI",name:"Company",lastPrice:10,changePct:-9.09,marketCap:1e9,
      volume:49.5e6,tradedValue:495e6,valueSource:"reported"},
  ]);
  assert.match(rows,/\*\*#1\. BBCA\*\*/);
  assert.match(rows,/\nVolume Shares \| \*\*120 Jt Shares\*\*\n\n\*\*#2\. TAXI\*\*/);
  assert.ok(!rows.includes("\n\n\n"));
});

test("optional official BEI gainers/losers digests use the same format",()=>{
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
    assert.match(description,/\*\*#1\. A\d{3}\*\* \| \*\*Rp /);
    assert.match(description,/\nMCap \| \*\*\d/);
    assert.match(description,/\nVolume Transaksi \| \*\*Rp /);
    assert.match(description,/\nVolume Shares \| \*\*1 Jt Shares\*\*/);
  }
});
