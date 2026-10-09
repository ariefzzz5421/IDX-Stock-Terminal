import "server-only";
import holdingsJson from "@/data/shareholders-2026-09.json";

type Row = [name: string, percentage: number, shares: number, type: string, localForeign: string, domicile: string];
const holdings = holdingsJson as unknown as Record<string, Row[]>;

export const OWNERSHIP_ROWS = Object.values(holdings).reduce((sum, rows) => sum + rows.length, 0);
export const OWNERSHIP_TICKERS = Object.keys(holdings).length;

const typeNames: Record<string, string> = {
  CP: "Corporate", ID: "Individual", IB: "Bank", MF: "Mutual Fund",
  SC: "Securities", OT: "Other", IS: "Insurance", PF: "Pension Fund", FD: "Foundation",
  "": "Unclassified",
};

export function ownershipOverview() {
  const types = new Map<string, number>();
  const investors = new Map<string, Set<string>>();
  const disclosedNames = new Set<string>();
  const busiest: { code: string; count: number }[] = [];
  for (const [code, rows] of Object.entries(holdings)) {
    busiest.push({ code, count: rows.length });
    for (const [name, , , type] of rows) {
      types.set(type, (types.get(type) ?? 0) + 1);
      disclosedNames.add(name.trim());
      const key = name.trim().toUpperCase();
      const codes = investors.get(key) ?? new Set<string>();
      codes.add(code);
      investors.set(key, codes);
    }
  }
  return {
    investorCount: disclosedNames.size,
    types: [...types].map(([type, count]) => ({ type, name: typeNames[type] ?? type, count, percentage: count / OWNERSHIP_ROWS * 100 })).sort((a, b) => b.count - a.count),
    crossHolders: [...investors].map(([name, codes]) => ({ name, count: codes.size })).sort((a, b) => b.count - a.count).slice(0, 12),
    busiest: busiest.sort((a, b) => b.count - a.count).slice(0, 12),
  };
}

export function findOwnership(query: string) {
  const needle = query.trim().toUpperCase().slice(0, 80);
  if (!needle) return [];
  return Object.entries(holdings).flatMap(([code, rows]) =>
    code.includes(needle) || rows.some(([name]) => name.toUpperCase().includes(needle))
      ? [{ code, matchingHolders: rows.filter(([name]) => name.toUpperCase().includes(needle)).slice(0, 3).map(([name]) => name), count: rows.length }]
      : [],
  ).slice(0, 24);
}

export function sharedHolderLinks(code: string) {
  const rows = holdings[code.toUpperCase()] ?? [];
  const names = new Set(rows.map(([name]) => name.trim().toUpperCase()));
  return Object.entries(holdings).flatMap(([otherCode, otherRows]) => {
    if (otherCode === code.toUpperCase()) return [];
    const shared = otherRows.filter(([name]) => names.has(name.trim().toUpperCase())).map(([name]) => name);
    return shared.length ? [{ code: otherCode, shared }] : [];
  }).sort((a, b) => b.shared.length - a.shared.length).slice(0, 16);
}
