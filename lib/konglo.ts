import "server-only";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { OWNERSHIP_SOURCE, shareholdersFor } from "@/lib/shareholders";

export const FORBES_LIST_URL = "https://www.forbes.com/lists/indonesia-billionaires/?view=pc";
export const FORBES_LIST_DATE = "10 Desember 2025";

export type KongloProfile = {
  slug: string;
  rank?: number;
  name: string;
  /** Forbes 2025 USD estimate; family figures belong to the family. */
  netWorthUsd?: number;
  wealthNote?: string;
  holderName?: string;
  candidateCodes: readonly string[];
  reportedDirect?: readonly { code: string; percentage: number; ownershipAsOf: string; sourceUrl: string }[];
  groupExposure?: readonly { code: string; sourceUrl: string; percentage?: number; shares?: number; ownershipAsOf?: string; holder?: string; holderNames?: readonly string[]; stakeMultiplier?: number }[];
};

const HAJI_SOURCE = "https://market.bisnis.com/read/20260921/192/2005815/deretan-portofolio-bisnis-haji-isam-dari-sawit-pertambangan-hingga-transportasi";
const BAKRIE_SOURCE = "https://bakrie-brothers.com/wp-content/uploads/2026/04/BNBR-Integrated-Annual-Report-2025.pdf";
const OWNERSHIP_DATE = "27 Februari 2026";

/** Forbes wealth and KSEI direct ownership have different dates and scopes. */
export const KONGLO_PROFILES: readonly KongloProfile[] = [
  { slug: "hartono", rank: 1, name: "Keluarga Hartono", netWorthUsd: 43.8e9, wealthNote: "Forbes 2025 menilai Budi & Michael Hartono bersama; angka historis ini bukan valuasi saham grup saat ini.", candidateCodes: [], groupExposure: [
    { code: "BBCA", holderNames: ["PT DWIMURIA INVESTAMA ANDALAN"], holder: "PT Dwimuria Investama Andalan", sourceUrl: "https://www.bca.co.id/id/tentang-bca/hubungan-investor/informasi-saham/komposisi-pemegang-saham" },
    { code: "BELI", holderNames: ["PT GLOBAL INVESTAMA ANDALAN"], holder: "PT Global Investama Andalan", sourceUrl: "https://about.blibli.com/investor-relations/prospectus/Preliminary%20Prospectus%20IPO%20-%20PT%20Global%20Digital%20Niaga%20Tbk.pdf" },
  ] },
  { slug: "prajogo-pangestu", rank: 2, name: "Prajogo Pangestu", netWorthUsd: 39.8e9, holderName: "PRAJOGO PANGESTU", candidateCodes: ["BRPT", "TPIA", "CUAN"] },
  { slug: "franky-widjaja", name: "Franky Oesman Widjaja", wealthNote: "Forbes menilai keluarga Widjaja US$28,3 miliar; angka itu bukan kekayaan pribadi Franky.", holderName: "FRANKY OESMAN WIDJAJA", candidateCodes: ["BOLA"], groupExposure: [{ code: "DSSA", percentage: 59.9, shares: 4615523200, ownershipAsOf: "31 Desember 2025", holder: "PT Sinar Mas Tunggal · deemed interest Franky", sourceUrl: "https://dssa.co.id/documents/Annual_Report_DSSA_2025.pdf" }] },
  { slug: "low-tuck-kwong", rank: 4, name: "Low Tuck Kwong", netWorthUsd: 24.9e9, holderName: "LOW TUCK KWONG", candidateCodes: ["BYAN", "MYOH", "MAHA"] },
  { slug: "anthoni-salim", rank: 5, name: "Anthoni (Antony) Salim & keluarga", netWorthUsd: 13.6e9, holderName: "ANTHONI SALIM", candidateCodes: ["DNET", "EMTK", "DCII", "BBCA"] },
  { slug: "otto-toto-sugiri", rank: 6, name: "Otto Toto Sugiri", netWorthUsd: 11.3e9, holderName: "OTTO TOTO SUGIRI", candidateCodes: ["DCII"] },
  { slug: "tahir", rank: 7, name: "Tahir & keluarga", netWorthUsd: 9.8e9, holderName: "TAHIR", candidateCodes: ["MAYA", "SONA", "MPRO"] },
  { slug: "marina-budiman", rank: 8, name: "Marina Budiman", netWorthUsd: 8.2e9, holderName: "MARINA BUDIMAN", candidateCodes: ["DCII"] },
  { slug: "dewi-kam", rank: 17, name: "Dewi Kam", netWorthUsd: 4.3e9, candidateCodes: [], groupExposure: [{ code: "BYAN", sourceUrl: "https://www.forbes.com/profile/dewi-kam/" }] },
  { slug: "garibaldi-thohir", rank: 19, name: "Garibaldi Thohir & keluarga", netWorthUsd: 3.8e9, holderName: "GARIBALDI THOHIR", candidateCodes: ["MBMA", "ADRO", "TRIM", "AADI", "ESSA", "PALM", "MDKA"] },
  { slug: "edwin-soeryadjaya", rank: 45, name: "Edwin Soeryadjaya & keluarga", netWorthUsd: 1.2e9, holderName: "EDWIN SOERYADJAYA", candidateCodes: ["MBMA", "ADRO", "SRTG", "AADI"] },
  { slug: "hary-tanoesoedibjo", rank: 48, name: "Hary Tanoesoedibjo", netWorthUsd: 1e9, holderName: "HARY TANOESOEDIBJO", candidateCodes: ["BHIT"] },
  { slug: "haji-isam", name: "Haji Isam (Samsudin Andi Arsyad)", candidateCodes: [], reportedDirect: [
    { code: "PACK", percentage: 20.05, ownershipAsOf: "18 September 2026", sourceUrl: HAJI_SOURCE },
    { code: "RANS", percentage: 1.4, ownershipAsOf: "31 Agustus 2026", sourceUrl: HAJI_SOURCE },
  ], groupExposure: ["JARR", "PGUN", "TEBE"].map((code) => ({ code, sourceUrl: HAJI_SOURCE })) },
  { slug: "happy-hapsoro", name: "Happy Hapsoro", holderName: "HAPSORO", candidateCodes: ["RAJA", "MINA", "SINI", "UANG", "ARKO"] },
  { slug: "bakrie", name: "Keluarga Bakrie", candidateCodes: [], groupExposure: [
    { code: "BNBR", sourceUrl: BAKRIE_SOURCE },
    { code: "VKTR", holderNames: ["BAKRIE & BROTHERS TBK, PT", "Bakrie Metal Industries, PT"], holder: "BNBR + PT Bakrie Metal Industries", sourceUrl: BAKRIE_SOURCE },
  ] },
  { slug: "hashim-djojohadikusumo", name: "Hashim Djojohadikusumo", candidateCodes: [], groupExposure: [
    { code: "COIN", sourceUrl: "https://market.bisnis.com/read/20251217/192/1937426/investasi-baru-arsari-group-milik-hashim-coin-hingga-blok-migas-natuna" },
    { code: "WIFI", holderNames: ["PT. INVESTASI SUKSES BERSAMA"], stakeMultiplier: 0.45, holder: "PT Arsari Sentra Data 45% × PT Investasi Sukses Bersama", sourceUrl: "https://legacy.pasardana.id/news/2025/1/10/pt-arsari-sentra-data-miliki-22-55-wifi-secara-tidak-langsung-melalui-kepemilikan-45-00-pt-investasi-sukses-bersama/" },
  ] },
];

export type KongloHolding = {
  code: string;
  name: string;
  percentage: number | null;
  ownershipAsOf: string | null;
  shares: number | null;
  price: number | null;
  priceAsOf: string | null;
  marketCap: number | null;
  indicativeValue: number | null;
  kind: "direct" | "group";
  holder: string;
  sourceUrl: string;
  snapshotSourceUrl?: string;
};

function valueFromMarketCap(percentage: number | null, marketCap: number | null) {
  return percentage !== null && marketCap !== null && marketCap > 0 ? percentage / 100 * marketCap : null;
}

export function kongloHoldings(profile: KongloProfile): KongloHolding[] {
  const direct: KongloHolding[] = profile.holderName ? profile.candidateCodes.flatMap((code) => {
    const holder = shareholdersFor(code).find((row) => row.name.toUpperCase() === profile.holderName);
    const company = getCompanyCatalogEntry(code);
    if (!holder || !company) return [];
    const price = company.closingPrice && company.closingPrice > 0 ? company.closingPrice : null;
    return [{ code, name: company.name, percentage: holder.percentage, ownershipAsOf: OWNERSHIP_DATE, shares: holder.shares, price,
      priceAsOf: price ? company.holdingsDate : null, marketCap: company.marketCap, indicativeValue: valueFromMarketCap(holder.percentage, company.marketCap),
      kind: "direct", holder: holder.name, sourceUrl: OWNERSHIP_SOURCE }];
  }) : [];
  const reported: KongloHolding[] = (profile.reportedDirect ?? []).flatMap((item) => {
    const company = getCompanyCatalogEntry(item.code);
    return company ? [{ code: item.code, name: company.name, percentage: item.percentage,
      ownershipAsOf: item.ownershipAsOf, shares: null, price: null, priceAsOf: null, marketCap: company.marketCap,
      indicativeValue: valueFromMarketCap(item.percentage, company.marketCap), kind: "direct", holder: profile.name, sourceUrl: item.sourceUrl }] : [];
  });
  const group: KongloHolding[] = (profile.groupExposure ?? []).flatMap(({ code, sourceUrl, percentage, shares, ownershipAsOf, holder, holderNames, stakeMultiplier }) => {
    const company = getCompanyCatalogEntry(code);
    if (!company) return [];
    const named = holderNames?.map((name) => shareholdersFor(code).find((row) => row.name.toUpperCase() === name.toUpperCase())) ?? [];
    const complete = named.length > 0 && named.every((row) => row !== undefined);
    const resolvedPercentage = complete ? named.reduce((sum, row) => sum + (row?.percentage ?? 0), 0) * (stakeMultiplier ?? 1) : percentage ?? null;
    const resolvedShares = complete ? Math.round(named.reduce((sum, row) => sum + (row?.shares ?? 0), 0) * (stakeMultiplier ?? 1)) : shares ?? null;
    return [{ code, name: company.name, percentage: resolvedPercentage, ownershipAsOf: complete ? OWNERSHIP_DATE : ownershipAsOf ?? null,
      shares: resolvedShares,
      price: null, priceAsOf: null, marketCap: company.marketCap,
      indicativeValue: valueFromMarketCap(resolvedPercentage, company.marketCap), kind: "group", holder: holder ?? "Entitas grup · porsi belum terverifikasi", sourceUrl,
      snapshotSourceUrl: complete ? OWNERSHIP_SOURCE : undefined }];
  });
  return [...direct, ...reported, ...group];
}

export function kongloPortfolioSummary(holdings: KongloHolding[]) {
  const direct = holdings.filter((item) => item.kind === "direct");
  const valued = direct.filter((item) => item.indicativeValue !== null);
  const groupValued = holdings.filter((item) => item.kind === "group" && item.indicativeValue !== null);
  return {
    directCount: direct.length,
    groupCount: holdings.length - direct.length,
    totalShares: direct.reduce((sum, item) => sum + (item.shares ?? 0), 0),
    sharesKnownCount: direct.filter((item) => item.shares !== null).length,
    indicativeValue: valued.length ? valued.reduce((sum, item) => sum + (item.indicativeValue ?? 0), 0) : null,
    valuedCount: valued.length,
    groupValue: groupValued.length ? groupValued.reduce((sum, item) => sum + (item.indicativeValue ?? 0), 0) : null,
    groupValuedCount: groupValued.length,
  };
}
