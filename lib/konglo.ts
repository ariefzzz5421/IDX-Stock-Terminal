import "server-only";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { shareholdersFor, type NamedShareholder } from "@/lib/shareholders";

export const FORBES_LIST_URL = "https://www.forbes.com/lists/indonesia-billionaires/?view=pc";
export const FORBES_LIST_DATE = "10 Desember 2025";

export type KongloProfile = {
  slug: string;
  rank: number;
  name: string;
  holderName?: string;
  candidateCodes: readonly string[];
  groupExposure?: readonly { code: string; sourceUrl: string }[];
};

/** Forbes rank identifies the person/family; percentages are matched separately against KSEI. */
export const KONGLO_PROFILES: readonly KongloProfile[] = [
  { slug: "hartono", rank: 1, name: "R. Budi & Michael Hartono", candidateCodes: [], groupExposure: [{ code: "BBCA", sourceUrl: "https://www.forbes.com/profile/r-budi-hartono/" }, { code: "BELI", sourceUrl: "https://www.forbes.com/profile/r-budi-hartono/" }] },
  { slug: "prajogo-pangestu", rank: 2, name: "Prajogo Pangestu", holderName: "PRAJOGO PANGESTU", candidateCodes: ["BRPT", "TPIA", "CUAN"] },
  { slug: "low-tuck-kwong", rank: 4, name: "Low Tuck Kwong", holderName: "LOW TUCK KWONG", candidateCodes: ["BYAN", "MYOH", "MAHA"] },
  { slug: "anthoni-salim", rank: 5, name: "Anthoni Salim & keluarga", holderName: "ANTHONI SALIM", candidateCodes: ["DNET", "EMTK", "DCII", "BBCA"] },
  { slug: "otto-toto-sugiri", rank: 6, name: "Otto Toto Sugiri", holderName: "OTTO TOTO SUGIRI", candidateCodes: ["DCII"] },
  { slug: "tahir", rank: 7, name: "Tahir & keluarga", holderName: "TAHIR", candidateCodes: ["MAYA", "SONA", "MPRO"] },
  { slug: "marina-budiman", rank: 8, name: "Marina Budiman", holderName: "MARINA BUDIMAN", candidateCodes: ["DCII"] },
  { slug: "dewi-kam", rank: 17, name: "Dewi Kam", candidateCodes: [], groupExposure: [{ code: "BYAN", sourceUrl: "https://www.forbes.com/profile/dewi-kam/" }] },
  { slug: "garibaldi-thohir", rank: 19, name: "Garibaldi Thohir & keluarga", holderName: "GARIBALDI THOHIR", candidateCodes: ["MBMA", "ADRO", "TRIM", "AADI", "ESSA", "PALM", "MDKA"] },
  { slug: "edwin-soeryadjaya", rank: 45, name: "Edwin Soeryadjaya & keluarga", holderName: "EDWIN SOERYADJAYA", candidateCodes: ["MBMA", "ADRO", "SRTG", "AADI"] },
  { slug: "hary-tanoesoedibjo", rank: 48, name: "Hary Tanoesoedibjo", holderName: "HARY TANOESOEDIBJO", candidateCodes: ["BHIT"] },
];

export type KongloHolding = { code: string; name: string; percentage: number | null; kind: "direct" | "group"; sourceUrl: string };

export function kongloHoldings(profile: KongloProfile): KongloHolding[] {
  const direct = profile.holderName ? profile.candidateCodes.flatMap((code) => {
    const holder: NamedShareholder | undefined = shareholdersFor(code).find((row) => row.name.toUpperCase() === profile.holderName);
    const company = getCompanyCatalogEntry(code);
    return holder && company ? [{ code, name: company.name, percentage: holder.percentage, kind: "direct" as const, sourceUrl: "https://www.idx.co.id/en/listed-companies/share-ownership-data-of-listed-companies/" }] : [];
  }) : [];
  const group = (profile.groupExposure ?? []).flatMap(({ code, sourceUrl }) => {
    const company = getCompanyCatalogEntry(code);
    return company ? [{ code, name: company.name, percentage: null, kind: "group" as const, sourceUrl }] : [];
  });
  return [...direct, ...group];
}
