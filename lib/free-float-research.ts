/** A disclosed ≥1% position is not automatically proof of beneficial ownership. */
export type FloatHolderInput = {
  name: string;
  percentage: number;
  shares: number;
  investorType: string;
  localForeign?: string;
  domicile?: string;
  affiliation: { label: string; sourceUrl: string } | null;
};

export type FloatHolderAssessment = FloatHolderInput & {
  treatment: "verified-affiliate" | "type-strategic" | "unverified";
};

export function investorTypeCode(type: string): string {
  const codes: Record<string, string> = {
    Corporate: "CP", Individual: "ID", Bank: "IB", Foundation: "FD",
    "Mutual Funds": "MF", Insurance: "IS", "Pension Funds": "PF",
    "Securities Company": "SC", Government: "GV",
    "State Owned Enterprises": "SOE", "State Owned Company": "SOE",
    "Sovereign Wealth Fund": "SWF",
  };
  return codes[type] ?? "—";
}

// Conservative, explicit assumptions for an indicative KSEI-based calculation.
// A type-based exclusion is not a claim that the holder is affiliated with the issuer.
const STRATEGIC_TYPES = new Set([
  "Corporate", "State Owned Enterprises", "State Owned Company", "Government",
  "Sovereign Wealth Fund", "Foundation",
]);

export function assessFloatHolders(holders: FloatHolderInput[]) {
  const assessed: FloatHolderAssessment[] = holders.map((holder) => ({
    ...holder,
    treatment: holder.affiliation ? "verified-affiliate"
      : STRATEGIC_TYPES.has(holder.investorType) ? "type-strategic" : "unverified",
  }));
  const disclosedPercent = assessed.reduce((sum, holder) => sum + holder.percentage, 0);
  const strategicPercent = assessed.reduce((sum, holder) => sum + (holder.treatment === "unverified" ? 0 : holder.percentage), 0);
  // Bad source rows must never become a plausible-looking float estimate.
  const valid = assessed.length > 0 && assessed.every((holder) => Number.isFinite(holder.percentage) && holder.percentage > 0 && holder.percentage <= 100)
    && disclosedPercent <= 100.01 && strategicPercent <= 100;
  return {
    holders: assessed,
    disclosedPercent,
    strategicPercent: valid ? strategicPercent : null,
    indicativeFloatPercent: valid ? 100 - strategicPercent : null,
    undisclosedPercent: valid ? Math.max(0, 100 - disclosedPercent) : null,
  };
}
