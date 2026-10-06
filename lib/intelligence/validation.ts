import { normalize, validClaimQuote, type Category } from "./core";
import type { ExtractedResearch } from "./openai";

function sourceHasDate(value: string, text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, monthValue, dayValue] = value.split("-").map(Number);
  const month = [
    ["january", "januari"], ["february", "februari"], ["march", "maret"], ["april"],
    ["may", "mei"], ["june", "juni"], ["july", "juli"], ["august", "agustus"],
    ["september"], ["october", "oktober"], ["november"], ["december", "desember"],
  ][monthValue - 1];
  if (!month || !Number.isInteger(dayValue) || dayValue < 1 || dayValue > 31) return false;
  const lower = text.toLowerCase();
  if (lower.includes(value) || lower.includes(`${String(dayValue).padStart(2, "0")}/${String(monthValue).padStart(2, "0")}/${year}`)) return true;
  return month.some((name) => new RegExp(`\\b0?${dayValue}\\b.{0,25}\\b${name}\\b.{0,12}${year}`, "i").test(lower));
}

function sourceHasNumber(value: number, text: string): boolean {
  if (!Number.isFinite(value) || value < 0) return false;
  const compact = text.replaceAll(",", "").replaceAll(".", "").replaceAll(" ", "");
  if (compact.includes(String(Math.trunc(value)))) return true;
  for (const match of text.matchAll(/(?:Rp\s*)?([\d.,]+)\s*(triliun|trillion|miliar|billion|juta|million)\b/gi)) {
    const raw = match[1].includes(",") ? Number(match[1].replaceAll(".", "").replace(",", ".")) : Number(match[1].replaceAll(",", ""));
    const multiplier = /triliun|trillion/i.test(match[2]) ? 1e12 : /miliar|billion/i.test(match[2]) ? 1e9 : 1e6;
    if (Number.isFinite(raw) && Math.abs(raw * multiplier - value) <= Math.max(1, value * 0.001)) return true;
  }
  return false;
}

export function parseResearchResponse(output: string, sourceText: string, ticker: string, category: Category): ExtractedResearch {
  let parsed: unknown;
  try { parsed = JSON.parse(output); } catch { throw new Error("OpenAI returned invalid JSON"); }
  return verifyResearch(parsed, sourceText, ticker, category);
}

export function verifyResearch(raw: unknown, sourceText: string, matchedTicker: string, category: Category): ExtractedResearch {
  if (!raw || typeof raw !== "object") throw new Error("AI returned invalid JSON");
  const item = raw as ExtractedResearch;
  if (item.ticker !== matchedTicker || item.category !== category || !["CONFIRMED", "PRELIMINARY", "UNCONFIRMED"].includes(item.status) || !["PROPOSED", "APPROVED", "EFFECTIVE", "COMPLETED", "SUSPENDED", "RESUMED", "UNKNOWN"].includes(item.phase) || !["POSITIVE", "NEGATIVE", "MIXED", "NEUTRAL", "UNCERTAIN"].includes(item.direction)) throw new Error("AI fields do not match source/catalog");
  if (!Array.isArray(item.evidence) || item.evidence.length === 0 || item.evidence.some((e) => !validClaimQuote(e.exactQuote, sourceText))) throw new Error("AI evidence quote cannot be verified in original document");
  for (const evidence of item.evidence) {
    const claimNumbers = evidence.claim.match(/\d[\d.,]*/g) ?? [];
    const quoteNumbers = new Set((evidence.exactQuote.match(/\d[\d.,]*/g) ?? []).map((v) => v.replace(/\D/g, "")));
    if (claimNumbers.some((v) => !quoteNumbers.has(v.replace(/\D/g, "")))) throw new Error("AI claim number is not present in its cited quote");
  }
  if (normalize(item.summary).length < 30) throw new Error("AI summary too short");
  const citedText = item.evidence.map((entry) => entry.exactQuote).join(" ");
  for (const value of [item.transactionIdr, item.newShares, item.existingShares, item.exercisePriceIdr]) {
    if (value != null && !sourceHasNumber(value, citedText)) {
      throw new Error("AI numeric fact cannot be verified in cited evidence");
    }
  }
  for (const value of [item.announcementDate, item.effectiveDate]) {
    if (value != null && !sourceHasDate(value, citedText)) throw new Error("AI date cannot be verified in cited evidence");
  }
  const phaseWords: Record<string, RegExp> = {
    APPROVED: /approved|disetujui|persetujuan/i, COMPLETED: /completed|selesai|rampung/i,
    SUSPENDED: /suspend|penghentian sementara/i, RESUMED: /resum|dibuka kembali/i,
  };
  if (phaseWords[item.phase] && !phaseWords[item.phase].test(sourceText)) throw new Error("AI lifecycle phase not supported by source");
  return item;
}
