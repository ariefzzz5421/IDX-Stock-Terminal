import assert from "node:assert/strict";
import test from "node:test";
import { eligibleNewsSource, newsSourceKey, marketNewsEmbed, tickerInNewsTitle } from "../lib/alerts/news-rules";

const now=new Date("2026-11-05T03:00:00Z");
const entry={
 sourceDocumentId:"ksei:dividend:SSMS:2026-11-05",
 title:"Schedule of Interim Dividend SAWIT SUMBERMAS SARANA Tbk (SSMS).",
 sourceUrl:"https://web.ksei.co.id/publications/corporate-action-schedules/cash-dividend",
 adapter:"KSEI Announcements",status:"UNCONFIRMED",
 aiStatus:null,aiSummary:null,publishedAt:new Date("2026-11-05T01:00:00Z"),
 fetchedAt:new Date("2026-11-05T02:58:00Z")
};
test("new KSEI documents eligible but outdated / unauthorised sources excluded",()=>{
 assert.equal(eligibleNewsSource(entry,now),true);
 assert.equal(eligibleNewsSource({...entry,fetchedAt:new Date("2026-11-04T23:00:00Z")},now),false);
 assert.equal(eligibleNewsSource({...entry,sourceUrl:"https://attacker.example/phishing"},now),false);
 assert.equal(eligibleNewsSource({...entry,status:"UNAVAILABLE"},now),false);
 assert.equal(eligibleNewsSource({...entry,sourceUrl:"http://web.ksei.co.id/foo"},now),false);
});
test("source-based news includes real article URL, date and an honest verification label",()=>{
 const embed=marketNewsEmbed(entry);
 assert.equal(embed.url,entry.sourceUrl);
 assert.equal(embed.fields[0].value,"SSMS");
 assert.match(embed.description,/AI NOT CONFIRMED/);
 assert.match(embed.fields[3].value,/Buka sumber asli/);
 assert.doesNotMatch(embed.description,/CONFIRMED.*keterbukaan final/);
 assert.equal(tickerInNewsTitle(entry.title),"SSMS");
 assert.equal(tickerInNewsTitle("No stock ticker"),null);
});
test("source id hash supplies stable dedupe without exposing raw external id",()=>{
 const key=newsSourceKey(entry.sourceDocumentId);
 assert.match(key,/^news:[a-f0-9]{64}$/);
 assert.equal(key,newsSourceKey(entry.sourceDocumentId));
 assert.notEqual(key,newsSourceKey(entry.sourceDocumentId+":2"));
});
