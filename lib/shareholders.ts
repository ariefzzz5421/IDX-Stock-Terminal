import "server-only";
import holdingsJson from "@/data/shareholders-2026-09.json";

export const OWNERSHIP_AS_OF = "30 September 2026";
export const OWNERSHIP_SOURCE = "https://www.idx.co.id/id/perusahaan-tercatat/data-kepemilikan-saham/";
export const OWNERSHIP_DOCUMENT = "https://www.idx.co.id/Media/yqjhhsee/peng-2026-09-00024-satu-persen.xlsx";

type HoldingTuple = [name: string, percentage: number, shares: number, investorType: string, localForeign: string, domicile: string];
type Affiliation = { label: string; sourceUrl: string };

/** Only source-confirmed relationships are tagged. Unknown is not independent. */
const AFFILIATIONS: Record<string, Record<string, Affiliation>> = {
  AADI: {
    "ADARO STRATEGIC INVESTMENTS": { label: "Terafiliasi pengendali", sourceUrl: "https://adaroindonesia.com/app/webroot/upload/files/Laporan%20Tahunan/AADI%20Annual%20Report%202025.pdf" },
    "GARIBALDI THOHIR": { label: "Pendiri grup", sourceUrl: "https://www.adaro.com/files/news/berkas_eng/177/Adaro-Energy-Annual-Report-2013-English.pdf" },
    "ALAMTRI RESOURCES INDONESIA TBK PT": { label: "Grup pengendali", sourceUrl: "https://adaroindonesia.com/app/webroot/upload/files/Laporan%20Tahunan/AADI%20Annual%20Report%202025.pdf" },
  },
};

export type NamedShareholder = {
  name: string;
  percentage: number;
  shares: number;
  investorType: string;
  localForeign: string;
  domicile: string;
  affiliation: Affiliation | null;
};

export function shareholdersFor(code: string): NamedShareholder[] {
  const upper = code.toUpperCase();
  const tuples = (holdingsJson as unknown as Record<string, HoldingTuple[]>)[upper] ?? [];
  return tuples
    .filter((row) => row[1] >= 1 && row[0])
    .map(([name, percentage, shares, investorType, localForeign, domicile]) => ({
      name, percentage, shares, investorType, localForeign, domicile,
      affiliation: AFFILIATIONS[upper]?.[name.toUpperCase()] ?? null,
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

/** Discover exact-name positions without guessing a person's company affiliations. */
export function codesForNamedShareholder(holderName: string): string[] {
  const needle = holderName.trim().toUpperCase();
  if (!needle) return [];
  return shareholderCodeIndex().get(needle) ?? [];
}

/** Exact-name cross-ticker positions from the same dated ownership snapshot. */
export function positionsForNamedShareholder(holderName: string): { code: string; percentage: number; shares: number }[] {
  const needle = holderName.trim().toUpperCase();
  if (!needle) return [];
  if (!positionIndex) {
    positionIndex = new Map();
    for (const [code, rows] of Object.entries(holdingsJson as unknown as Record<string, HoldingTuple[]>)) {
      for (const [name, percentage, shares] of rows) {
        if (percentage < 1) continue;
        const key = name.trim().toUpperCase();
        const positions = positionIndex.get(key) ?? [];
        positions.push({ code, percentage, shares });
        positionIndex.set(key, positions);
      }
    }
    for (const positions of positionIndex.values()) positions.sort((a, b) => b.percentage - a.percentage || a.code.localeCompare(b.code));
  }
  return positionIndex.get(needle) ?? [];
}

let positionIndex: Map<string, { code: string; percentage: number; shares: number }[]> | null = null;

let holderIndex: Map<string, string[]> | null = null;
function shareholderCodeIndex() {
  if (holderIndex) return holderIndex;
  holderIndex = new Map();
  for (const [code, rows] of Object.entries(holdingsJson as unknown as Record<string, HoldingTuple[]>)) {
    for (const [name, percentage] of rows) {
      if (percentage < 1) continue;
      const key = name.trim().toUpperCase();
      const codes = holderIndex.get(key) ?? [];
      codes.push(code);
      holderIndex.set(key, codes);
    }
  }
  return holderIndex;
}
