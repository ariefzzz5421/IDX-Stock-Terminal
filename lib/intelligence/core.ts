import { createHash } from "node:crypto";

export const CATEGORIES = [
  "RIGHTS_ISSUE", "PRIVATE_PLACEMENT", "BUYBACK", "MERGER_ACQUISITION",
  "DIVESTMENT", "SPIN_OFF", "TENDER_OFFER", "DIVIDEND", "STOCK_SPLIT", "BONUS_SHARES",
  "CAPITAL_INJECTION", "OWNERSHIP", "WARRANT", "DILUTION", "FCA",
  "UMA", "SUSPENSION", "RESUMPTION", "WATCHLIST_BOARD", "GOING_CONCERN",
  "DELISTING", "RELISTING", "MSCI", "FTSE", "GDX_GDXJ", "INDEX_FLOW",
] as const;
export type Category = typeof CATEGORIES[number];
export type Verification = "CONFIRMED" | "PRELIMINARY" | "UNCONFIRMED" | "SUPERSEDED";
export type Direction = "POSITIVE" | "NEGATIVE" | "MIXED" | "NEUTRAL" | "UNCERTAIN";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "WATCH";
export const sha = (value: string) => createHash("sha256").update(value).digest("hex");
export const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

export function matchTickers(text: string, known: Set<string>): string[] {
  const found = new Set<string>();
  for (const match of text.toUpperCase().matchAll(/\b[A-Z]{4}(?:-[RW][0-9]?)?\b/g)) {
    const code = match[0].split("-")[0];
    if (known.has(code)) found.add(code);
  }
  return [...found];
}

export function eventIdentity(ticker: string, category: Category, documentText: string, publishedAt: Date | null, sourceDocumentId?: string): string {
  const offering = documentText.match(/(?:Penawaran Umum Terbatas|Limited Public Offering|PMHMETD)\s*(?:ke-)?([IVX0-9]+)/i)?.[1]?.toUpperCase();
  const rightsCode = documentText.match(/\b([A-Z]{4}-R)\b/)?.[1];
  const year = publishedAt?.getUTCFullYear() ?? new Date().getUTCFullYear();
  const fiscalYear = documentText.match(/(?:fiscal year|tahun buku)\s*[:\s]*(20\d{2})/i)?.[1];
  const paymentDay = documentText.match(/(?:payment date|tanggal pembayaran)[^\n]{0,80}?(\d{1,2}\s+[A-Za-z]+\s+20\d{2})/i)?.[1]?.toUpperCase().replace(/\s+/g, "");
  const action = offering || rightsCode || (category === "DIVIDEND" && paymentDay ? `${fiscalYear ?? year}:${paymentDay}` : sourceDocumentId ? sha(sourceDocumentId).slice(0, 16) : publishedAt?.toISOString().slice(0, 10) ?? String(year));
  return `${ticker}:${category}:${action}`;
}

export function changeType(previous: { status: Verification; contentFingerprint: string; factsJson: string } | null, next: { status: Verification; contentFingerprint: string; factsJson: string }): string | null {
  if (!previous) return "NEW";
  if (previous.status !== next.status) return `${previous.status}_TO_${next.status}`;
  if (previous.contentFingerprint === next.contentFingerprint) return null;
  const oldFacts = JSON.parse(previous.factsJson) as Record<string, unknown>;
  const newFacts = JSON.parse(next.factsJson) as Record<string, unknown>;
  delete oldFacts.evidence;
  delete newFacts.evidence;
  if (JSON.stringify(oldFacts) === JSON.stringify(newFacts)) return null;
  return "FACTS_CHANGED";
}

export function calculateDilution(existingShares: number, newShares: number): number | null {
  if (!Number.isFinite(existingShares) || !Number.isFinite(newShares) || existingShares <= 0 || newShares < 0) return null;
  return newShares / (existingShares + newShares) * 100;
}

export function calculateSizeToMarketCap(amount: number, marketCap: number): number | null {
  if (!Number.isFinite(amount) || !Number.isFinite(marketCap) || amount < 0 || marketCap <= 0) return null;
  return amount / marketCap * 100;
}

export function scoreMateriality(facts: {
  transactionIdr?: number | null; marketCapIdr?: number | null; dilutionPct?: number | null;
  changesControl?: boolean; leverageConcern?: boolean; indexRebalance?: boolean;
  governanceConcern?: boolean; officialEvidence: boolean; genuinelyNew: boolean;
}): { score: number; priority: Priority; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const size = facts.transactionIdr != null && facts.marketCapIdr != null
    ? calculateSizeToMarketCap(facts.transactionIdr, facts.marketCapIdr) : null;
  if (size != null) { const points = Math.min(25, Math.round(size / 2)); score += points; if (points) reasons.push(`Nilai transaksi sekitar ${size.toFixed(1)}% kapitalisasi pasar`); }
  if (facts.dilutionPct != null) { const points = Math.min(25, Math.round(facts.dilutionPct)); score += points; if (points) reasons.push(`Potensi dilusi ${facts.dilutionPct.toFixed(1)}%`); }
  if (facts.changesControl) { score += 20; reasons.push("Potensi perubahan pengendalian"); }
  if (facts.leverageConcern) { score += 12; reasons.push("Implikasi leverage"); }
  if (facts.indexRebalance) { score += 12; reasons.push("Penyesuaian indeks terjadwal"); }
  if (facts.governanceConcern) { score += 15; reasons.push("Risiko tata kelola atau kelangsungan usaha"); }
  if (facts.officialEvidence) score += 8;
  if (facts.genuinelyNew) score += 5;
  score = Math.min(100, score);
  return { score, priority: score >= 75 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 25 ? "MEDIUM" : "WATCH", reasons };
}

export function validClaimQuote(quote: string, sourceText: string): boolean {
  const q = normalize(quote).toLocaleLowerCase("id-ID");
  return q.length >= 12 && normalize(sourceText).toLocaleLowerCase("id-ID").includes(q);
}

export function deriveRunStatus(input: { failedAdapters: number; errors: number; pending: number; sourceAdapters: number; successfulAdapters: number }): "SUCCESS" | "PARTIAL" | "FAILED" {
  if (input.sourceAdapters > 0 && input.successfulAdapters === 0) return "FAILED";
  return input.failedAdapters || input.errors || input.pending ? "PARTIAL" : "SUCCESS";
}
