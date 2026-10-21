import assert from "node:assert/strict";
import test from "node:test";
import {
  marketCardHeading, shortCardText, corporateActionLabel,
  dateWibForCard, decimalPct,
} from "../lib/alerts/card-content";

test("premium card is dynamic across market Volume, ARA, ARB and EOD gainers/losers",()=>{
  assert.deepEqual(marketCardHeading("IDX · TOP 10 VOLUME · 14:00 WIB"),{
    kind:"VOLUME",heading:"TOP 10 VOLUME",clock:"14:00 WIB",preview:false,accent:"#eec780",
  });
  assert.equal(marketCardHeading("IDX · TOP 10 ARA (INDICATIVE) · 14:10 WIB").kind,"ARA");
  assert.equal(marketCardHeading("IDX · TOP 10 ARB (INDICATIVE) · 14:10 WIB").kind,"ARB");
  assert.equal(marketCardHeading("IDX MARKET · TOP GAINERS").kind,"GAINERS");
  assert.equal(marketCardHeading("IDX MARKET · TOP LOSERS").kind,"LOSERS");
  const sample=marketCardHeading("PREVIEW ONLY · IDX · TOP 10 VOLUME · PREVIEW WIB");
  assert.equal(sample.preview,true);
  assert.equal(sample.clock,"SNAPSHOT");
});

test("corporate action source fields are not invented or made official by default",()=>{
  assert.equal(corporateActionLabel("DIVIDEND"),"DIVIDEN");
  assert.equal(corporateActionLabel("RIGHTS_ISSUE"),"RIGHTS ISSUE");
  assert.equal(corporateActionLabel("MERGER_ACQUISITION"),"MERGER / AKUISISI");
  assert.equal(corporateActionLabel("NOT_RECORDED"),"NOT RECORDED");
  assert.equal(dateWibForCard(null),"N/D");
  assert.equal(dateWibForCard("2026-10-21T17:30:00Z"),"22 Okt 2026");
  assert.equal(dateWibForCard("wrong"),"N/D");
});

test("sanitize article labels and use Indonesian percentage formatting",()=>{
  assert.equal(shortCardText("@everyone\nOfficial announcement",50),"@\u200beveryone Official announcement");
  assert.equal(shortCardText("",50),"N/D");
  assert.equal(decimalPct(-2.96),"-2,96%");
  assert.equal(decimalPct(4.1),"+4,10%");
});