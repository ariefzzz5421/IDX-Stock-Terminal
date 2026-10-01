import "server-only";
import holdingsJson from "@/data/shareholders-2026-02.json";

export const OWNERSHIP_AS_OF = "27 Februari 2026";
export const OWNERSHIP_SOURCE = "https://www.idx.co.id/en/listed-companies/share-ownership-data-of-listed-companies/";
export const OWNERSHIP_TRANSCRIPTION = "https://github.com/aryakdaniswara/idx-stock-ownership";

type HoldingTuple = [name: string, percentage: number, shares: number, investorType: string];
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
  affiliation: Affiliation | null;
};

export function shareholdersFor(code: string): NamedShareholder[] {
  const upper = code.toUpperCase();
  const tuples = (holdingsJson as unknown as Record<string, HoldingTuple[]>)[upper] ?? [];
  return tuples
    .filter((row) => row[1] > 1 && row[0])
    .map(([name, percentage, shares, investorType]) => ({
      name, percentage, shares, investorType,
      affiliation: AFFILIATIONS[upper]?.[name.toUpperCase()] ?? null,
    }))
    .sort((a, b) => b.percentage - a.percentage);
}
